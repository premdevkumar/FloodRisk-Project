package com.floodmanagement.api.model;

import java.time.Instant;

public record SosAlert(
    String citizenId,
    double latitude,
    double longitude,
    int dangerLevel,
    Instant timestamp
) {}
