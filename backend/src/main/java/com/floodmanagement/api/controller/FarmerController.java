package com.floodmanagement.api.controller;

import com.floodmanagement.api.service.FarmerAdvisorService;
import com.floodmanagement.api.service.FarmerAdvisorService.AdvisoryRequest;
import com.floodmanagement.api.service.FarmerAdvisorService.AdvisoryResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/farmer")
public class FarmerController {

    private final FarmerAdvisorService farmerAdvisorService;

    public FarmerController(FarmerAdvisorService farmerAdvisorService) {
        this.farmerAdvisorService = farmerAdvisorService;
    }

    @PostMapping("/harvest-advisor")
    public ResponseEntity<AdvisoryResponse> getHarvestAdvisory(@RequestBody AdvisoryRequest req) {
        AdvisoryResponse response = farmerAdvisorService.generateAdvisory(req);
        return ResponseEntity.ok(response);
    }
}
