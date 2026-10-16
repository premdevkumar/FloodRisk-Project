package com.floodmanagement.api.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisasterEvent {
    private String regionName;
    private double latitude;
    private double longitude;
    private int dangerLevel;
}
