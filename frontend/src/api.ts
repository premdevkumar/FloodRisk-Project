import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('flood_jwt_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FloodStation {
  stationId: string;
  stationName: string;
  riverName: string;
  state: string;
  latitude: number;
  longitude: number;
  currentWaterLevelMeters: number;
  dangerLevelMeters: number;
  status: 'NORMAL' | 'WARNING' | 'DANGER' | 'EXTREME_DANGER';
  strandedResidents: number;
  lastUpdated: string;
}

export interface AdvisoryRequest {
  cropType: string;
  daysPlanted: number;
  totalDaysToMaturity: number;
  expectedYieldTons: number;
  marketPricePerTon: number;
  harvestingCostRs: number;
  floodProbabilityPercent: number;
  floodArrivalTimeHours: number;
  hasInsurance: boolean;
  language: string;
}

export interface AdvisoryResponse {
  recommendation: 'HARVEST_TODAY' | 'WAIT' | 'CLAIM_INSURANCE';
  maturityPercentage: number;
  revenueIfHarvestedNowRs: number;
  expectedValueIfWaitRs: number;
  netFinancialBenefitRs: number;
  riskAssessmentText: string;
  detailedAdviceReport: string;
}

export interface RescuePriorityZone {
  stationId: string;
  stationName: string;
  riverName: string;
  state: string;
  latitude: number;
  longitude: number;
  status: string;
  strandedResidents: number;
  priorityScore: number;
  recommendedAction: string;
}
