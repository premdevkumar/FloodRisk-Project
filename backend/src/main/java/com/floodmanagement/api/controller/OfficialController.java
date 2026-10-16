package com.floodmanagement.api.controller;

import com.floodmanagement.api.service.RescueTriageService;
import com.floodmanagement.api.service.RescueTriageService.RescuePriorityZone;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/official")
public class OfficialController {

    private final RescueTriageService rescueTriageService;

    public OfficialController(RescueTriageService rescueTriageService) {
        this.rescueTriageService = rescueTriageService;
    }

    @GetMapping("/rescue-metrics")
    public ResponseEntity<List<RescuePriorityZone>> getRescueMetrics() {
        return ResponseEntity.ok(rescueTriageService.getPrioritizedRescueZones());
    }

    @PostMapping("/dispatch-rescue")
    public ResponseEntity<?> dispatchRescueTeam(@RequestParam String stationId, @RequestParam String teamName) {
        return ResponseEntity.ok(Map.of(
                "status", "DISPATCHED",
                "station_id", stationId,
                "assigned_team", teamName,
                "timestamp", System.currentTimeMillis(),
                "message", "Emergency rescue task force " + teamName + " successfully deployed to station " + stationId
        ));
    }
}
