package com.floodmanagement.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloodPredictionResponse {

    @JsonProperty("station_id")
    private String stationId;

    @JsonProperty("predicted_water_level_m")
    private Double predictedWaterLevelM;

    @JsonProperty("flood_probability")
    private Double floodProbability;

    @JsonProperty("risk_level")
    private String riskLevel;
}
