package com.floodmanagement.api.controller;

import com.floodmanagement.api.model.RouteSegment;
import com.floodmanagement.api.service.EvacuationRoutingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/routes")
@RequiredArgsConstructor
public class RoutingController {

    private final EvacuationRoutingService routingService;

    @GetMapping
    public ResponseEntity<List<RouteSegment>> getRoute(
            @RequestParam Long start, 
            @RequestParam Long end, 
            @RequestParam(defaultValue = "true") boolean safeMode) {
            
        List<RouteSegment> route = routingService.getRoute(start, end, safeMode);
        return ResponseEntity.ok(route);
    }
}
