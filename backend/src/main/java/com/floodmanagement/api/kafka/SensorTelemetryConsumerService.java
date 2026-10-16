package com.floodmanagement.api.kafka;

import com.floodmanagement.api.model.FloodPredictionRequest;
import com.floodmanagement.api.model.FloodPredictionResponse;
import com.floodmanagement.api.model.SensorTelemetryEvent;
import com.floodmanagement.api.model.DisasterEvent;
import com.floodmanagement.api.service.AlertCacheService;
import com.floodmanagement.api.service.MlPredictionClientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * High-throughput streaming consumer processing live partitioned sensor and weather telemetry data.
 * Leverages Redis deduplication before invoking the Python FastAPI PyTorch LSTM model to predict water levels.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SensorTelemetryConsumerService {

    private final MlPredictionClientService mlClient;
    private final AlertCacheService alertCacheService;
    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = KafkaTopicConfig.SENSOR_TELEMETRY_TOPIC, groupId = "sensor-telemetry-group")
    public void consumeTelemetry(SensorTelemetryEvent event) {
        log.info("Ingesting sensor event for station: {} at {}m level", event.getStationId(), event.getCurrentWaterLevelMeters());

        // Step 1: Redis Deduplication Layer to prevent redundant ML inference under flood surges
        String dedupKey = "sensor:" + event.getStationId() + ":" + Math.round(event.getCurrentWaterLevelMeters() * 10.0);
        if (!alertCacheService.checkAndSetDeduplication(dedupKey, 60)) {
            log.info("Deduplicating frequent sensor event for station: {}", event.getStationId());
            return;
        }

        // Step 2: Prepare time-series request for PyTorch LSTM
        List<Double> waterLevels = (event.getHistoricalWaterLevels() != null && !event.getHistoricalWaterLevels().isEmpty())
                ? event.getHistoricalWaterLevels()
                : List.of(event.getCurrentWaterLevelMeters() * 0.9, event.getCurrentWaterLevelMeters());
        List<Double> rainfall = (event.getHistoricalRainfallMm() != null && !event.getHistoricalRainfallMm().isEmpty())
                ? event.getHistoricalRainfallMm()
                : List.of(event.getCurrentRainfallMm() * 0.8, event.getCurrentRainfallMm());

        FloodPredictionRequest request = FloodPredictionRequest.builder()
                .stationId(event.getStationId())
                .historicalWaterLevels(waterLevels)
                .historicalRainfallMm(rainfall)
                .build();

        // Step 3: Invoke Python ML Service
        FloodPredictionResponse prediction = mlClient.predictFlood(request);

        // Step 4: Broadcast to live WebSockets if risk is elevated (DANGER or EXTREME_DANGER)
        if ("DANGER".equalsIgnoreCase(prediction.getRiskLevel()) || "EXTREME_DANGER".equalsIgnoreCase(prediction.getRiskLevel())) {
            int dangerScore = "EXTREME_DANGER".equalsIgnoreCase(prediction.getRiskLevel()) ? 5 : 4;
            DisasterEvent disasterEvent = new DisasterEvent(
                    "Sensor Alert: " + event.getStationId() + " (" + prediction.getRiskLevel() + ")",
                    event.getLatitude(),
                    event.getLongitude(),
                    dangerScore
            );
            messagingTemplate.convertAndSend("/topic/floods", disasterEvent);
            log.warn("High-risk flood alert triggered for station {}! Predicted level: {}m, Probability: {}",
                    event.getStationId(), prediction.getPredictedWaterLevelM(), prediction.getFloodProbability());
        }
    }
}
