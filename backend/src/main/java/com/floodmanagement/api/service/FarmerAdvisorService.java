package com.floodmanagement.api.service;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

/**
 * Agricultural decision-support engine evaluating expected monetary value of early crop harvesting
 * versus flood inundation risk based on crop maturity, market pricing, and precipitation forecasts.
 */
@Service
public class FarmerAdvisorService {

    @Data
    @Builder
    public static class AdvisoryRequest {
        private String cropType;
        private int daysPlanted;
        private int totalDaysToMaturity;
        private double expectedYieldTons;
        private double marketPricePerTon;
        private double harvestingCostRs;
        private double floodProbabilityPercent;
        private double floodArrivalTimeHours;
        private boolean hasInsurance;
        private String language;
    }

    @Data
    @Builder
    public static class AdvisoryResponse {
        private String recommendation;
        private double maturityPercentage;
        private double revenueIfHarvestedNowRs;
        private double expectedValueIfWaitRs;
        private double netFinancialBenefitRs;
        private String riskAssessmentText;
        private String detailedAdviceReport;
    }

    public AdvisoryResponse generateAdvisory(AdvisoryRequest req) {
        double maturity = Math.min(100.0, ((double) req.getDaysPlanted() / Math.max(1, req.getTotalDaysToMaturity())) * 100.0);
        double floodProbDecimal = req.getFloodProbabilityPercent() / 100.0;

        double qualityLossPercent = maturity >= 80 ? 0.05 : (maturity >= 60 ? 0.15 : 0.35);

        double grossYieldValue = req.getExpectedYieldTons() * req.getMarketPricePerTon();
        double revenueNow = (grossYieldValue * (1.0 - qualityLossPercent)) - req.getHarvestingCostRs();
        double expectedValueWait = grossYieldValue * (1.0 - floodProbDecimal);
        double netBenefit = revenueNow - expectedValueWait;

        String cropLower = req.getCropType().toLowerCase();
        boolean isFloodSensitive = cropLower.contains("pulse") || cropLower.contains("vegetable");

        String recommendation;
        String riskText;

        if (req.isHasInsurance() && floodProbDecimal > 0.75 && maturity < 50) {
            recommendation = "CLAIM_INSURANCE";
            riskText = "Extreme flood probability detected for young crop. Submitting an insurance claim is financially safer than premature harvesting.";
        } else if ((maturity >= 75 && floodProbDecimal >= 0.35) || (isFloodSensitive && maturity >= 60 && floodProbDecimal >= 0.40) || netBenefit >= 5000) {
            recommendation = "HARVEST_TODAY";
            riskText = String.format("Crop maturity is at %.1f%% with a %.1f%% flood risk. Harvesting today preserves ₹%.2f in net crop value.",
                    maturity, req.getFloodProbabilityPercent(), Math.max(0, revenueNow));
        } else {
            recommendation = "WAIT";
            riskText = String.format("Crop is only %.1f%% mature. Statistical expected value of waiting (₹%.2f) outweighs immediate emergency harvesting.",
                    maturity, expectedValueWait);
        }

        String report = String.format("""
            ==================================================
                   🌾 SMART CROP HARVESTING ADVISORY REPORT
            ==================================================
            Crop Type: %s | Maturity: %.1f%% (%d / %d Days)
            Recommendation: >>> %s <<<
            
            FINANCIAL BREAKDOWN:
            • Revenue if Harvested Today: ₹%.2f
            • Expected Value if Waiting: ₹%.2f
            • Net Financial Benefit of Immediate Action: ₹%.2f
            
            BIOLOGICAL & FLOOD RISK ANALYSIS:
            • Estimated Flood Probability: %.1f%% (Arrival: ~%.1f hours)
            • Crop Sensitivity Index: %s
            • Strategy: %s
            ==================================================
            """,
            req.getCropType(), maturity, req.getDaysPlanted(), req.getTotalDaysToMaturity(),
            recommendation, revenueNow, expectedValueWait, netBenefit,
            req.getFloodProbabilityPercent(), req.getFloodArrivalTimeHours(),
            isFloodSensitive ? "HIGH SENSITIVITY (Waterlogging damage within 12h)" : "MODERATE/LOW SENSITIVITY",
            riskText
        );

        return AdvisoryResponse.builder()
                .recommendation(recommendation)
                .maturityPercentage(Math.round(maturity * 10.0) / 10.0)
                .revenueIfHarvestedNowRs(Math.round(revenueNow * 100.0) / 100.0)
                .expectedValueIfWaitRs(Math.round(expectedValueWait * 100.0) / 100.0)
                .netFinancialBenefitRs(Math.round(netBenefit * 100.0) / 100.0)
                .riskAssessmentText(riskText)
                .detailedAdviceReport(report)
                .build();
    }
}
