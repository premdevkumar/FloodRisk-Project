import React, { useState } from 'react';
import { Sprout, FileText, CheckCircle2 } from 'lucide-react';
import { apiClient } from './api';
import type { AdvisoryRequest, AdvisoryResponse } from './api';

export const FarmerDashboard: React.FC = () => {
  const [cropType, setCropType] = useState('Pulses');
  const [daysPlanted, setDaysPlanted] = useState(65);
  const [totalDaysToMaturity, setTotalDaysToMaturity] = useState(90);
  const [expectedYieldTons, setExpectedYieldTons] = useState(4.5);
  const [marketPricePerTon, setMarketPricePerTon] = useState(45000);
  const [harvestingCostRs, setHarvestingCostRs] = useState(15000);
  const [floodProbabilityPercent, setFloodProbabilityPercent] = useState(70);
  const [floodArrivalTimeHours] = useState(24);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [language, setLanguage] = useState('en');

  const [loading, setLoading] = useState(false);
  const [advisory, setAdvisory] = useState<AdvisoryResponse | null>(null);
  const [translatedReport, setTranslatedReport] = useState<string | null>(null);

  const handleCalculateAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTranslatedReport(null);

    const payload: AdvisoryRequest = {
      cropType,
      daysPlanted: Number(daysPlanted),
      totalDaysToMaturity: Number(totalDaysToMaturity),
      expectedYieldTons: Number(expectedYieldTons),
      marketPricePerTon: Number(marketPricePerTon),
      harvestingCostRs: Number(harvestingCostRs),
      floodProbabilityPercent: Number(floodProbabilityPercent),
      floodArrivalTimeHours: Number(floodArrivalTimeHours),
      hasInsurance,
      language,
    };

    try {
      const res = await apiClient.post<AdvisoryResponse>('/farmer/harvest-advisor', payload);
      setAdvisory(res.data);
      if (language !== 'en') {
        await handleTranslate(res.data.detailedAdviceReport, language);
      }
    } catch {
      // Local Math Engine Fallback if API offline
      const maturity = Math.min(100, (daysPlanted / totalDaysToMaturity) * 100);
      const floodProbDec = floodProbabilityPercent / 100;
      const gross = expectedYieldTons * marketPricePerTon;
      const revenueNow = gross * 0.85 - harvestingCostRs;
      const expectedWait = gross * (1 - floodProbDec);
      const benefit = revenueNow - expectedWait;

      let rec: 'HARVEST_TODAY' | 'WAIT' | 'CLAIM_INSURANCE' = 'HARVEST_TODAY';
      if (hasInsurance && floodProbDec > 0.75 && maturity < 50) rec = 'CLAIM_INSURANCE';
      else if (benefit < 5000 && maturity < 70) rec = 'WAIT';

      const mockReport = `
      ==================================================
             🌾 SMART CROP HARVESTING ADVISORY REPORT
      ==================================================
      Crop Type: ${cropType} | Maturity: ${maturity.toFixed(1)}% (${daysPlanted} / ${totalDaysToMaturity} Days)
      Recommendation: >>> ${rec} <<<
      
      FINANCIAL BREAKDOWN:
      • Revenue if Harvested Today: ₹${revenueNow.toLocaleString('en-IN')}
      • Expected Value if Waiting: ₹${expectedWait.toLocaleString('en-IN')}
      • Net Financial Benefit of Immediate Action: ₹${benefit.toLocaleString('en-IN')}
      
      BIOLOGICAL & FLOOD RISK ANALYSIS:
      • Estimated Flood Probability: ${floodProbabilityPercent}% (Arrival: ~${floodArrivalTimeHours} hours)
      • Strategy: Emergency harvest advised to prevent total crop loss under active flood forecast.
      ==================================================
      `;

      const mockRes: AdvisoryResponse = {
        recommendation: rec,
        maturityPercentage: Number(maturity.toFixed(1)),
        revenueIfHarvestedNowRs: Math.round(revenueNow),
        expectedValueIfWaitRs: Math.round(expectedWait),
        netFinancialBenefitRs: Math.round(benefit),
        riskAssessmentText: `Maturity at ${maturity.toFixed(1)}% with ${floodProbabilityPercent}% flood probability. Harvesting today saves crop value.`,
        detailedAdviceReport: mockReport,
      };

      setAdvisory(mockRes);
      if (language !== 'en') {
        await handleTranslate(mockReport, language);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (text: string, targetLang: string) => {
    try {
      const res = await fetch('http://localhost:8001/api/v1/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_language: targetLang }),
      });
      const data = await res.json();
      setTranslatedReport(data.translated_text);
    } catch {
      setTranslatedReport(`[${targetLang.toUpperCase()} TRANSLATION] ` + text);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Sprout size={32} color="#16a34a" />
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>Multi-Lingual Smart Farmer Advisory</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Biological & financial decision matrix for emergency crop harvesting
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left Input Form */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Enter Farm Parameters</h3>
          <form onSubmit={handleCalculateAdvisory} style={styles.form}>
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Language / భాష / भाषा</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={styles.select}>
                  <option value="en">English</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Crop Type</label>
                <select value={cropType} onChange={(e) => setCropType(e.target.value)} style={styles.select}>
                  <option value="Pulses">Pulses (High Waterlogging Sensitivity)</option>
                  <option value="Vegetables">Vegetables (High Sensitivity)</option>
                  <option value="Rice">Rice (Paddy - Moderate Tolerance)</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Wheat">Wheat</option>
                </select>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Days Planted</label>
                <input
                  type="number"
                  value={daysPlanted}
                  onChange={(e) => setDaysPlanted(Number(e.target.value))}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Days to Maturity</label>
                <input
                  type="number"
                  value={totalDaysToMaturity}
                  onChange={(e) => setTotalDaysToMaturity(Number(e.target.value))}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Expected Yield (Tons)</label>
                <input
                  type="number"
                  step="0.1"
                  value={expectedYieldTons}
                  onChange={(e) => setExpectedYieldTons(Number(e.target.value))}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Market Price (₹ / Ton)</label>
                <input
                  type="number"
                  value={marketPricePerTon}
                  onChange={(e) => setMarketPricePerTon(Number(e.target.value))}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Harvesting Cost (₹ Total)</label>
                <input
                  type="number"
                  value={harvestingCostRs}
                  onChange={(e) => setHarvestingCostRs(Number(e.target.value))}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Flood Probability (%)</label>
                <input
                  type="number"
                  value={floodProbabilityPercent}
                  onChange={(e) => setFloodProbabilityPercent(Number(e.target.value))}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="insurance"
                  checked={hasInsurance}
                  onChange={(e) => setHasInsurance(e.target.checked)}
                />
                <label htmlFor="insurance" style={{ ...styles.label, cursor: 'pointer' }}>
                  Has Crop Insurance Policy (PMFBY)
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Analyzing Economic Risk...' : 'Generate Harvest Advisory'}
            </button>
          </form>
        </div>

        {/* Right Advisory Output Display */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>AI Advisory Output</h3>

          {advisory ? (
            <div>
              <div
                style={{
                  ...styles.recommendationBanner,
                  backgroundColor:
                    advisory.recommendation === 'HARVEST_TODAY'
                      ? '#dcfce7'
                      : advisory.recommendation === 'CLAIM_INSURANCE'
                      ? '#fef3c7'
                      : '#e0f2fe',
                  color:
                    advisory.recommendation === 'HARVEST_TODAY'
                      ? '#15803d'
                      : advisory.recommendation === 'CLAIM_INSURANCE'
                      ? '#b45309'
                      : '#0369a1',
                }}
              >
                <CheckCircle2 size={24} style={{ marginRight: '8px' }} />
                <span style={{ fontSize: '18px', fontWeight: 800 }}>
                  RECOMMENDED ACTION: {advisory.recommendation}
                </span>
              </div>

              <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                  <p style={styles.metricLabel}>Crop Maturity</p>
                  <p style={styles.metricValue}>{advisory.maturityPercentage}%</p>
                </div>
                <div style={styles.metricCard}>
                  <p style={styles.metricLabel}>Revenue Now</p>
                  <p style={styles.metricValue}>₹{advisory.revenueIfHarvestedNowRs.toLocaleString('en-IN')}</p>
                </div>
                <div style={styles.metricCard}>
                  <p style={styles.metricLabel}>Exp. Value Wait</p>
                  <p style={styles.metricValue}>₹{advisory.expectedValueIfWaitRs.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#334155' }}>
                  Detailed Multi-Lingual Report:
                </h4>
                <pre style={styles.reportPre}>
                  {translatedReport || advisory.detailedAdviceReport}
                </pre>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <FileText size={48} color="#94a3b8" />
              <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b' }}>
                Fill farm parameters and click "Generate Harvest Advisory" to view recommendation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: 'calc(100vh - 70px)',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  cardTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
  },
  select: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
  },
  input: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
  },
  button: {
    marginTop: '10px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '15px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  recommendationBanner: {
    padding: '14px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '10px',
  },
  metricCard: {
    backgroundColor: '#f1f5f9',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  metricLabel: {
    margin: 0,
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600,
  },
  metricValue: {
    margin: '4px 0 0',
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
  },
  reportPre: {
    backgroundColor: '#0f172a',
    color: '#38bdf8',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
    lineHeight: 1.5,
  },
  emptyState: {
    height: '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
};
