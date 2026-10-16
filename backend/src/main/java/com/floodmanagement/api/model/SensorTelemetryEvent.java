package com.floodmanagement.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Sensor and weather telemetry data ingested across partitioned Kafka topics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorTelemetryEvent {
    private String stationId;
    private String riverName;
    private double latitude;
    private double longitude;
    private double currentWaterLevelMeters;
    private double currentRainfallMm;
    private List<Double> historicalWaterLevels;
    private List<Double> historicalRainfallMm;
    private Instant timestamp;
}
