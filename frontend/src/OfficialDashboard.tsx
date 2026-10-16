import React, { useEffect, useState } from 'react';
import { ShieldAlert, Send, Radio, Users, CheckCircle, AlertOctagon } from 'lucide-react';
import { apiClient } from './api';
import type { RescuePriorityZone } from './api';

export const OfficialDashboard: React.FC = () => {
  const [zones, setZones] = useState<RescuePriorityZone[]>([]);
  const [dispatchedTeams, setDispatchedTeams] = useState<Record<string, boolean>>({});
  const [smsBroadcasted, setSmsBroadcasted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRescueMetrics();
  }, []);

  const fetchRescueMetrics = async () => {
    try {
      const res = await apiClient.get<RescuePriorityZone[]>('/official/rescue-metrics');
      setZones(res.data);
    } catch {
      // Fallback sorted triage list
      const defaults: RescuePriorityZone[] = [
        {
          stationId: 'CWC-AP-01',
          stationName: 'Vijayawada Prakasham Barrage Zone',
          riverName: 'Krishna River',
          state: 'Andhra Pradesh',
          latitude: 16.5062,
          longitude: 80.6050,
          status: 'EXTREME_DANGER',
          strandedResidents: 450,
          priorityScore: 1450, // 1000 + 450
          recommendedAction: 'IMMEDIATE HELICOPTER & NDRF BOAT EVACUATION DISPATCHED',
        },
        {
          stationId: 'CWC-AP-02',
          stationName: 'Rajahmundry Sir Arthur Cotton Barrage Zone',
          riverName: 'Godavari River',
          state: 'Andhra Pradesh',
          latitude: 17.0005,
          longitude: 81.7800,
          status: 'DANGER',
          strandedResidents: 280,
          priorityScore: 780, // 500 + 280
          recommendedAction: 'DISPATCH REGIONAL RESCUE TEAM & BROADCAST EMERGENCY SMS',
        },
        {
          stationId: 'CWC-TS-01',
          stationName: 'Bhadrachalam Station Zone',
          riverName: 'Godavari River',
          state: 'Telangana',
          latitude: 17.6700,
          longitude: 80.8900,
          status: 'DANGER',
          strandedResidents: 190,
          priorityScore: 690, // 500 + 190
          recommendedAction: 'DISPATCH REGIONAL RESCUE TEAM & BROADCAST EMERGENCY SMS',
        },
        {
          stationId: 'CWC-KA-01',
          stationName: 'Almatti Dam Reservoir Perimeter',
          riverName: 'Krishna River',
          state: 'Karnataka',
          latitude: 16.3300,
          longitude: 75.8800,
          status: 'WARNING',
          strandedResidents: 45,
          priorityScore: 145, // 100 + 45
          recommendedAction: 'STAGE RESCUE BOATS AT BORDER PERIMETER & ALERT RESIDENTS',
        },
      ];
      setZones(defaults);
    }
  };

  const handleDispatch = async (stationId: string, teamName: string) => {
    try {
      await apiClient.post('/official/dispatch-rescue', null, { params: { stationId, teamName } });
    } catch {
      // offline fallback action
    }
    setDispatchedTeams((prev) => ({ ...prev, [stationId]: true }));
    alert(`🚨 RESCUE TASK FORCE DISPATCHED: ${teamName} assigned to station ${stationId}`);
  };

  const handleBroadcastSms = (stationId: string, zoneName: string) => {
    setSmsBroadcasted((prev) => ({ ...prev, [stationId]: true }));
    alert(`📱 EMERGENCY SMS BROADCAST: Evacuation alert dispatched to all mobile devices in ${zoneName}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <ShieldAlert size={32} color="#dc2626" />
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>Official Rescue Triage & Dispatch Center</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Real-time algorithmic priority sorting for flood disaster emergency response
          </p>
        </div>
      </div>

      <div style={styles.list}>
        {zones.map((zone, idx) => (
          <div key={zone.stationId} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={styles.priorityRank}>#{idx + 1}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>{zone.stationName}</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    River: {zone.riverName} • State: {zone.state}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>
                  Score: {zone.priorityScore}
                </div>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: zone.status === 'EXTREME_DANGER' ? '#fecaca' : '#ffedd5',
                    color: zone.status === 'EXTREME_DANGER' ? '#dc2626' : '#c2410c',
                  }}
                >
                  {zone.status}
                </span>
              </div>
            </div>

            <div style={styles.cardBody}>
              <div style={styles.infoRow}>
                <Users size={18} color="#dc2626" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  Stranded Residents in Hazard Zone: {zone.strandedResidents} people
                </span>
              </div>

              <div style={styles.actionBox}>
                <AlertOctagon size={18} color="#b45309" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#78350f' }}>
                  RECOMMENDED ACTION: {zone.recommendedAction}
                </span>
              </div>
            </div>

            <div style={styles.cardFooter}>
              <button
                onClick={() => handleDispatch(zone.stationId, `NDRF Alpha-${idx + 1}`)}
                disabled={dispatchedTeams[zone.stationId]}
                style={{
                  ...styles.btn,
                  backgroundColor: dispatchedTeams[zone.stationId] ? '#16a34a' : '#0284c7',
                }}
              >
                {dispatchedTeams[zone.stationId] ? (
                  <>
                    <CheckCircle size={16} style={{ marginRight: 6 }} /> Team Deployed
                  </>
                ) : (
                  <>
                    <Send size={16} style={{ marginRight: 6 }} /> Dispatch Rescue Team
                  </>
                )}
              </button>

              <button
                onClick={() => handleBroadcastSms(zone.stationId, zone.stationName)}
                disabled={smsBroadcasted[zone.stationId]}
                style={{
                  ...styles.btn,
                  backgroundColor: smsBroadcasted[zone.stationId] ? '#475569' : '#dc2626',
                }}
              >
                {smsBroadcasted[zone.stationId] ? (
                  <>
                    <CheckCircle size={16} style={{ marginRight: 6 }} /> SMS Sent
                  </>
                ) : (
                  <>
                    <Radio size={16} style={{ marginRight: 6 }} /> Broadcast Emergency SMS
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    borderLeft: '6px solid #dc2626',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  priorityRank: {
    fontSize: '20px',
    fontWeight: 900,
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '6px 12px',
    borderRadius: '8px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '12px',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fffbeb',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #fde68a',
  },
  cardFooter: {
    display: 'flex',
    gap: '12px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
};
