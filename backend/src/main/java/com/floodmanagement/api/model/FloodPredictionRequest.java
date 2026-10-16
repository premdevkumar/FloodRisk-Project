package com.floodmanagement.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloodPredictionRequest {

    @JsonProperty("station_id")
    private String stationId;

    @JsonProperty("historical_water_levels")
    private List<Double> historicalWaterLevels;

    @JsonProperty("historical_rainfall_mm")
    private List<Double> historicalRainfallMm;
}
