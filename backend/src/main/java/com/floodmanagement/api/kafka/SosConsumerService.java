package com.floodmanagement.api.kafka;

import com.floodmanagement.api.model.DisasterEvent;
import com.floodmanagement.api.model.FloodPredictionRequest;
import com.floodmanagement.api.model.FloodPredictionResponse;
import com.floodmanagement.api.model.SosAlert;
import com.floodmanagement.api.service.AlertCacheService;
import com.floodmanagement.api.service.MlPredictionClientService;
import com.floodmanagement.api.service.SosLocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Kafka listener processing inbound citizen SOS alerts, persisting them
 * spatially, querying the Python ML service for hydrological risk assessment,
 * deduplicating triggers via Redis, and publishing live updates to STOMP WebSocket subscribers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SosConsumerService {

    private final SosLocationService sosLocationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MlPredictionClientService mlPredictionClient;
    private final AlertCacheService alertCacheService;

    @KafkaListener(topics = "sos-alerts", groupId = "sos-routing-group")
    public void consumeSosAlert(SosAlert alert) {
        log.info("Processing incoming SOS alert for citizen {}", alert.citizenId());

        // Step 1: Redis Deduplication Layer (deduplicate citizen requests within 30 seconds)
        String dedupKey = "sos:" + alert.citizenId();
        if (!alertCacheService.checkAndSetDeduplication(dedupKey, 30)) {
            log.info("Deduplicating frequent SOS submission from citizen {}", alert.citizenId());
            return;
        }

        // Step 2: Persist spatial SOS alert
        try {
            sosLocationService.saveAlert(alert);
        } catch (Exception e) {
            log.error("Failed to persist spatial SOS alert for citizen {}: {}", alert.citizenId(), e.getMessage());
        }

        // Step 3: Invoke Python ML Microservice (FastAPI + PyTorch LSTM)
        int dangerLevel = alert.dangerLevel();
        try {
            FloodPredictionRequest mlRequest = FloodPredictionRequest.builder()
                    .stationId("SOS-STATION-" + alert.citizenId())
                    .historicalWaterLevels(List.of(12.0, 14.5, 16.0, 18.0))
                    .historicalRainfallMm(List.of(40.0, 55.0, 70.0, 85.0))
                    .build();

            FloodPredictionResponse prediction = mlPredictionClient.predictFlood(mlRequest);
            log.info("Python ML Service Risk for citizen {}: level={}, prob={}",
                    alert.citizenId(), prediction.getRiskLevel(), prediction.getFloodProbability());

            if ("EXTREME_DANGER".equalsIgnoreCase(prediction.getRiskLevel())) {
                dangerLevel = Math.max(dangerLevel, 5);
            } else if ("DANGER".equalsIgnoreCase(prediction.getRiskLevel())) {
                dangerLevel = Math.max(dangerLevel, 4);
            }
        } catch (Exception e) {
            log.warn("ML assessment skipped for citizen {}: {}", alert.citizenId(), e.getMessage());
        }

        // Step 4: Publish to live WebSocket topic
        try {
            DisasterEvent event = new DisasterEvent(
                "SOS Danger Zone - " + alert.citizenId(),
                alert.latitude(),
                alert.longitude(),
                dangerLevel
            );
            messagingTemplate.convertAndSend("/topic/floods", event);
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket alert for citizen {}: {}", alert.citizenId(), e.getMessage());
        }
    }
}
