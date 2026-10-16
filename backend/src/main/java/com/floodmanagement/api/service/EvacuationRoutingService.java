package com.floodmanagement.api.service;

import com.floodmanagement.api.model.RouteSegment;
import com.floodmanagement.api.repository.RouteRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Computes dynamic routing segments using pgRouting Dijkstra algorithms,
 * caching results with regard to flood avoidance modes.
 */
@Slf4j
@Service
public class EvacuationRoutingService {

    private final RouteRepository routeRepository;

    public EvacuationRoutingService(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    /**
     * Resolves shortest evacuation path, optionally routing around active flood-inundated edges.
     */
    @Cacheable(value = "evacuation-routes", key = "#startId + '-' + #endId + '-' + #safeMode")
    public List<RouteSegment> getRoute(Long startId, Long endId, boolean safeMode) {
        log.info("Calculating evacuation route from node {} to node {} (safeMode={})", startId, endId, safeMode);

        List<Map<String, Object>> rawSegments = routeRepository.calculateDynamicRouteRaw(startId, endId, safeMode);
        List<RouteSegment> segments = new ArrayList<>();

        for (Map<String, Object> row : rawSegments) {
            segments.add(new RouteSegment(
                ((Number) row.get("seq")).intValue(),
                ((Number) row.get("pathSeq")).intValue(),
                ((Number) row.get("node")).longValue(),
                ((Number) row.get("edge")).longValue(),
                ((Number) row.get("cost")).doubleValue(),
                ((Number) row.get("aggCost")).doubleValue(),
                (String) row.get("geojson")
            ));
        }

        return segments;
    }
}
