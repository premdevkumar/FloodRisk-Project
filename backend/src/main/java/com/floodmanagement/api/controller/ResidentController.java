package com.floodmanagement.api.controller;

import com.floodmanagement.api.entity.FloodZone;
import com.floodmanagement.api.kafka.SosProducerService;
import com.floodmanagement.api.model.SosAlert;
import com.floodmanagement.api.service.CwcScraperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Endpoints for citizen SOS dispatches and proximity-based flood hazard monitoring.
 */
@RestController
@RequestMapping("/api/v1/resident")
@RequiredArgsConstructor
public class ResidentController {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private final CwcScraperService cwcScraperService;
    private final SosProducerService sosProducerService;

    @PostMapping("/sos-alert")
    public ResponseEntity<?> sendSosAlert(@RequestBody SosAlert alert) {
        sosProducerService.publishSosAlert(alert);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "SOS Alert queued successfully"));
    }

    @GetMapping("/flood-stations")
    public ResponseEntity<List<FloodZone>> getFloodStations() {
        return ResponseEntity.ok(cwcScraperService.getAllStations());
    }

    @GetMapping("/nearby-alerts")
    public ResponseEntity<?> getNearbyAlerts(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "50") double radiusKm) {

        List<FloodZone> stations = cwcScraperService.getAllStations();
        List<FloodZone> nearby = stations.stream()
                .filter(z -> haversineDistance(lat, lng, z.getLatitude(), z.getLongitude()) <= radiusKm)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "resident_latitude", lat,
                "resident_longitude", lng,
                "radius_km", radiusKm,
                "total_nearby_stations", nearby.size(),
                "stations", nearby
        ));
    }

    /**
     * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
     */
    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
