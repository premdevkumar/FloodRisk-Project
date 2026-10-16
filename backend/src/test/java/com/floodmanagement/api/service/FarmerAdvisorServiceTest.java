package com.floodmanagement.api.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FarmerAdvisorServiceTest {

    private final FarmerAdvisorService service = new FarmerAdvisorService();

    @Test
    void recommendsInsuranceForYoungInsuredCropWithExtremeFloodRisk() {
        FarmerAdvisorService.AdvisoryRequest request = FarmerAdvisorService.AdvisoryRequest.builder()
                .cropType("Rice")
                .daysPlanted(30)
                .totalDaysToMaturity(100)
                .expectedYieldTons(10)
                .marketPricePerTon(1000)
                .harvestingCostRs(100)
                .floodProbabilityPercent(80)
                .floodArrivalTimeHours(4)
                .hasInsurance(true)
                .language("en")
                .build();

        FarmerAdvisorService.AdvisoryResponse response = service.generateAdvisory(request);

        assertEquals("CLAIM_INSURANCE", response.getRecommendation());
        assertEquals(30.0, response.getMaturityPercentage());
        assertTrue(response.getRiskAssessmentText().contains("insurance claim"));
    }

    @Test
    void recommendsHarvestWhenMatureCropHasElevatedFloodRiskAndReportsFinancials() {
        FarmerAdvisorService.AdvisoryRequest request = FarmerAdvisorService.AdvisoryRequest.builder()
                .cropType("Rice")
                .daysPlanted(80)
                .totalDaysToMaturity(100)
                .expectedYieldTons(10)
                .marketPricePerTon(10_000)
                .harvestingCostRs(1_000)
                .floodProbabilityPercent(40)
                .floodArrivalTimeHours(6)
                .hasInsurance(false)
                .language("en")
                .build();

        FarmerAdvisorService.AdvisoryResponse response = service.generateAdvisory(request);

        assertEquals("HARVEST_TODAY", response.getRecommendation());
        assertEquals(80.0, response.getMaturityPercentage());
        assertEquals(94_000.0, response.getRevenueIfHarvestedNowRs());
        assertEquals(60_000.0, response.getExpectedValueIfWaitRs());
        assertEquals(34_000.0, response.getNetFinancialBenefitRs());
        assertTrue(response.getDetailedAdviceReport().contains("Recommendation: >>> HARVEST_TODAY <<<"));
    }

    @Test
    void recommendsHarvestForFloodSensitiveCropAtSensitivityThreshold() {
        FarmerAdvisorService.AdvisoryRequest request = FarmerAdvisorService.AdvisoryRequest.builder()
                .cropType("Pulse crop")
                .daysPlanted(60)
                .totalDaysToMaturity(100)
                .expectedYieldTons(1)
                .marketPricePerTon(1_000)
                .harvestingCostRs(100)
                .floodProbabilityPercent(40)
                .floodArrivalTimeHours(8)
                .hasInsurance(false)
                .language("en")
                .build();

        FarmerAdvisorService.AdvisoryResponse response = service.generateAdvisory(request);

        assertEquals("HARVEST_TODAY", response.getRecommendation());
        assertEquals(60.0, response.getMaturityPercentage());
        assertTrue(response.getDetailedAdviceReport().contains("HIGH SENSITIVITY"));
    }

    @Test
    void recommendsWaitingWhenEarlyHarvestHasLowerExpectedValue() {
        FarmerAdvisorService.AdvisoryRequest request = FarmerAdvisorService.AdvisoryRequest.builder()
                .cropType("Rice")
                .daysPlanted(20)
                .totalDaysToMaturity(100)
                .expectedYieldTons(1)
                .marketPricePerTon(1_000)
                .harvestingCostRs(100)
                .floodProbabilityPercent(10)
                .floodArrivalTimeHours(24)
                .hasInsurance(false)
                .language("en")
                .build();

        FarmerAdvisorService.AdvisoryResponse response = service.generateAdvisory(request);

        assertEquals("WAIT", response.getRecommendation());
        assertEquals(20.0, response.getMaturityPercentage());
        assertEquals(900.0, response.getExpectedValueIfWaitRs());
        assertTrue(response.getRiskAssessmentText().contains("outweighs immediate emergency harvesting"));
    }
}
