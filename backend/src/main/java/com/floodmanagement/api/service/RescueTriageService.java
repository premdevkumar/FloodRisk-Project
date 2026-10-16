package com.floodmanagement.api.service;

import com.floodmanagement.api.entity.FloodZone;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Priority queue scoring engine that evaluates stranded population count and flood severity
 * to rank rescue zones for NDRF and SDRF emergency dispatches.
 */
@Service
public class RescueTriageService {

    private final CwcScraperService cwcScraperService;

    public RescueTriageService(CwcScraperService cwcScraperService) {
        this.cwcScraperService = cwcScraperService;
    }

    @Data
    @Builder
    public static class RescuePriorityZone {
        private String stationId;
        private String stationName;
        private String riverName;
        private String state;
        private double latitude;
        private double longitude;
        private String status;
        private int strandedResidents;
        private int priorityScore;
        private String recommendedAction;
    }

    public List<RescuePriorityZone> getPrioritizedRescueZones() {
        List<FloodZone> stations = cwcScraperService.getAllStations();

        return stations.stream()
                .map(this::calculatePriority)
                .sorted(Comparator.comparingInt(RescuePriorityZone::getPriorityScore).reversed())
                .collect(Collectors.toList());
    }

    private RescuePriorityZone calculatePriority(FloodZone zone) {
        int baseScore;
        String action;

        switch (zone.getStatus().toUpperCase()) {
            case "EXTREME_DANGER":
                baseScore = 1000;
                action = "IMMEDIATE HELICOPTER & NDRF BOAT EVACUATION DISPATCHED";
                break;
            case "DANGER":
                baseScore = 500;
                action = "DISPATCH REGIONAL RESCUE TEAM & BROADCAST EMERGENCY SMS";
                break;
            case "WARNING":
                baseScore = 100;
                action = "STAGE RESCUE BOATS AT BORDER PERIMETER & ALERT RESIDENTS";
                break;
            default:
                baseScore = 0;
                action = "CONTINUOUS MONITORING & ROUTINE PATROL";
                break;
        }

        int totalScore = baseScore + zone.getStrandedResidents();

        return RescuePriorityZone.builder()
                .stationId(zone.getStationId())
                .stationName(zone.getStationName())
                .riverName(zone.getRiverName())
                .state(zone.getState())
                .latitude(zone.getLatitude())
                .longitude(zone.getLongitude())
                .status(zone.getStatus())
                .strandedResidents(zone.getStrandedResidents())
                .priorityScore(totalScore)
                .recommendedAction(action)
                .build();
    }
}
