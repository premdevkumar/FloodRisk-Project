import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Map, Sprout, Activity } from 'lucide-react';
import { apiClient } from './api';
import { ResidentMap } from './ResidentMap';
import { FarmerDashboard } from './FarmerDashboard';
import { OfficialDashboard } from './OfficialDashboard';

interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: string;
  fullName: string;
  phoneNumber: string;
  district: string;
  state: string;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'OFFICIAL' | 'FARMER' | 'MAP'>('USERS');
  const [users, setUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get<UserRecord[]>('/admin/users');
      setUsers(res.data);
    } catch {
      // Fallback user list
      setUsers([
        {
          id: 1,
          username: 'premdevkumar',
          email: 'premdevkumar@floodmanagement.gov.in',
          role: 'ADMIN',
          fullName: 'Prem Dev Kumar (System SuperAdmin)',
          phoneNumber: '+91-9876543210',
          district: 'Central HQ',
          state: 'National Capital',
        },
        {
          id: 2,
          username: 'resident_ap',
          email: 'resident@vza.org',
          role: 'RESIDENT',
          fullName: 'Ramesh Kumar',
          phoneNumber: '+91-9123456789',
          district: 'Krishna',
          state: 'Andhra Pradesh',
        },
        {
          id: 3,
          username: 'farmer_telangana',
          email: 'farmer@kisan.in',
          role: 'FARMER',
          fullName: 'Srinivas Rao',
          phoneNumber: '+91-9988776655',
          district: 'Khammam',
          state: 'Telangana',
        },
        {
          id: 4,
          username: 'official_ndrf',
          email: 'officer@ndrf.gov.in',
          role: 'OFFICIAL',
          fullName: 'Cmdr. Vikram Singh',
          phoneNumber: '+91-9443322110',
          district: 'Vijayawada Central',
          state: 'Andhra Pradesh',
        },
      ]);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={32} color="#0284c7" />
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>Admin SuperDashboard Oversight</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Master system controller • Account: <b>premdevkumar</b>
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab('USERS')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'USERS' ? '#0284c7' : '#e2e8f0',
              color: activeTab === 'USERS' ? '#ffffff' : '#334155',
            }}
          >
            <Users size={16} style={{ marginRight: 6 }} /> User Registry
          </button>
          <button
            onClick={() => setActiveTab('OFFICIAL')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'OFFICIAL' ? '#0284c7' : '#e2e8f0',
              color: activeTab === 'OFFICIAL' ? '#ffffff' : '#334155',
            }}
          >
            <Activity size={16} style={{ marginRight: 6 }} /> Official Triage
          </button>
          <button
            onClick={() => setActiveTab('FARMER')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'FARMER' ? '#0284c7' : '#e2e8f0',
              color: activeTab === 'FARMER' ? '#ffffff' : '#334155',
            }}
          >
            <Sprout size={16} style={{ marginRight: 6 }} /> Farmer Advisor
          </button>
          <button
            onClick={() => setActiveTab('MAP')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'MAP' ? '#0284c7' : '#e2e8f0',
              color: activeTab === 'MAP' ? '#ffffff' : '#334155',
            }}
          >
            <Map size={16} style={{ marginRight: 6 }} /> Resident Map
          </button>
        </div>
      </div>

      {activeTab === 'USERS' && (
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#0f172a' }}>
            System User Registry & Role Permissions
          </h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Full Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>District / State</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={styles.tdRow}>
                  <td style={styles.td}>{u.id}</td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>{u.username}</td>
                  <td style={styles.td}>{u.fullName}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={styles.roleBadge}>{u.role}</span>
                  </td>
                  <td style={styles.td}>
                    {u.district}, {u.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'OFFICIAL' && <OfficialDashboard />}
      {activeTab === 'FARMER' && <FarmerDashboard />}
      {activeTab === 'MAP' && <ResidentMap />}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: 600,
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thRow: {
    backgroundColor: '#f1f5f9',
    textAlign: 'left',
  },
  th: {
    padding: '12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
  },
  tdRow: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '12px',
    fontSize: '13px',
    color: '#1e293b',
  },
  roleBadge: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontWeight: 700,
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '12px',
  },
};
