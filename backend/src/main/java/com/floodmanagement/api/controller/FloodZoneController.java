package com.floodmanagement.api.controller;

import com.floodmanagement.api.entity.FloodZone;
import com.floodmanagement.api.repository.FloodZoneRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller demonstrating PostGIS-backed CRUD and spatial queries.
 */
@RestController
@RequestMapping("/api/v1/flood-zones")
public class FloodZoneController {

    private final FloodZoneRepository floodZoneRepository;

    public FloodZoneController(FloodZoneRepository floodZoneRepository) {
        this.floodZoneRepository = floodZoneRepository;
    }

    /**
     * Persists a flood zone. The entity's @PrePersist hook automatically
     * builds the PostGIS Point geometry from the lat/lng fields.
     */
    @PostMapping
    public ResponseEntity<FloodZone> createFloodZone(@RequestBody FloodZone zone) {
        FloodZone saved = floodZoneRepository.save(zone);
        return ResponseEntity.ok(saved);
    }

    /**
     * Spatial query: returns all flood zones within a given radius
     * of a reference point, ordered nearest-first.
     *
     * Example: GET /api/v1/flood-zones/nearby?lat=26.85&lng=80.91&radiusKm=50
     */
    @GetMapping("/nearby")
    public ResponseEntity<Map<String, Object>> findNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "50") double radiusKm) {

        double radiusMeters = radiusKm * 1000;
        List<FloodZone> zones = floodZoneRepository.findZonesWithinRadius(lng, lat, radiusMeters);

        return ResponseEntity.ok(Map.of(
                "center_latitude", lat,
                "center_longitude", lng,
                "radius_km", radiusKm,
                "total_results", zones.size(),
                "zones", zones
        ));
    }

    /**
     * Fetch all zones by status (NORMAL, WARNING, DANGER, EXTREME_DANGER).
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<FloodZone>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(floodZoneRepository.findByStatus(status));
    }
}
