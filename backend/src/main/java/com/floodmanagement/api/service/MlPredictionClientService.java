package com.floodmanagement.api.service;

import com.floodmanagement.api.model.FloodPredictionRequest;
import com.floodmanagement.api.model.FloodPredictionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Client service invoking the Python FastAPI PyTorch LSTM flood prediction microservice.
 */
@Slf4j
@Service
public class MlPredictionClientService {

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public MlPredictionClientService(
            RestTemplateBuilder builder,
            @Value("${ml.service.url:http://localhost:8001}") String mlServiceUrl) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
        this.mlServiceUrl = mlServiceUrl;
    }

    /**
     * Calls Python FastAPI endpoint: POST /api/v1/predict-flood
     */
    public FloodPredictionResponse predictFlood(FloodPredictionRequest request) {
        String endpoint = mlServiceUrl + "/api/v1/predict-flood";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<FloodPredictionRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<FloodPredictionResponse> response = restTemplate.postForEntity(
                    endpoint,
                    entity,
                    FloodPredictionResponse.class
            );

            log.info("ML Prediction received for station {}: probability={}, risk={}",
                    request.getStationId(),
                    response.getBody() != null ? response.getBody().getFloodProbability() : null,
                    response.getBody() != null ? response.getBody().getRiskLevel() : null);

            return response.getBody();
        } catch (Exception ex) {
            log.warn("Failed to reach Python ML service at {}: {}. Generating rule-based fallback.", endpoint, ex.getMessage());
            // Fallback prediction
            double latestWater = (request.getHistoricalWaterLevels() != null && !request.getHistoricalWaterLevels().isEmpty())
                    ? request.getHistoricalWaterLevels().get(request.getHistoricalWaterLevels().size() - 1)
                    : 15.0;
            double latestRain = (request.getHistoricalRainfallMm() != null && !request.getHistoricalRainfallMm().isEmpty())
                    ? request.getHistoricalRainfallMm().get(request.getHistoricalRainfallMm().size() - 1)
                    : 50.0;
            double prob = Math.min(1.0, (latestWater / 30.0) * 0.6 + (latestRain / 200.0) * 0.4);
            String risk = prob >= 0.70 ? "EXTREME_DANGER" : (prob >= 0.50 ? "DANGER" : "NORMAL");

            return FloodPredictionResponse.builder()
                    .stationId(request.getStationId())
                    .predictedWaterLevelM(latestWater + (latestRain * 0.03))
                    .floodProbability(prob)
                    .riskLevel(risk)
                    .build();
        }
    }
}
