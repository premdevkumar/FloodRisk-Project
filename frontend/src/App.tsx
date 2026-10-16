import React, { useState } from 'react';
import { ShieldAlert, LogOut, User as UserIcon } from 'lucide-react';
import { Login } from './Login';
import { Register } from './Register';
import { ResidentMap } from './ResidentMap';
import { FarmerDashboard } from './FarmerDashboard';
import { OfficialDashboard } from './OfficialDashboard';
import { AdminDashboard } from './AdminDashboard';

export interface UserState {
  username: string;
  role: string;
  fullName: string;
}

export const App: React.FC = () => {
  const [user, setUser] = useState<UserState | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  const handleLogout = () => {
    localStorage.removeItem('flood_jwt_token');
    setUser(null);
    setView('LOGIN');
  };

  if (!user) {
    if (view === 'REGISTER') {
      return <Register onRegisterSuccess={(u) => u ? setUser(u) : setView('LOGIN')} onNavigateLogin={() => setView('LOGIN')} />;
    }
    return <Login onLoginSuccess={(u) => setUser(u)} onNavigateRegister={() => setView('REGISTER')} />;
  }

  return (
    <div style={styles.appContainer}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={28} color="#0284c7" />
          <div>
            <h1 style={styles.navTitle}>Flood Risk & Rescue Management</h1>
            <span style={styles.navSubtitle}>AI-Powered Emergency Decision System</span>
          </div>
        </div>

        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <UserIcon size={18} color="#0284c7" />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                {user.fullName || user.username}
              </span>
              <span style={styles.roleBadge}>{user.role}</span>
            </div>
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} style={{ marginRight: 6 }} /> Logout
          </button>
        </div>
      </header>

      {/* Role-Based Dashboard View Rendering */}
      <main style={styles.mainContent}>
        {user.role === 'ADMIN' && <AdminDashboard />}
        {user.role === 'OFFICIAL' && <OfficialDashboard />}
        {user.role === 'FARMER' && <FarmerDashboard />}
        {user.role === 'RESIDENT' && <ResidentMap />}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, system-ui, sans-serif',
    backgroundColor: '#f8fafc',
  },
  navbar: {
    height: '70px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  navTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 800,
    color: '#0f172a',
  },
  navSubtitle: {
    fontSize: '11px',
    color: '#64748b',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  roleBadge: {
    marginLeft: '6px',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontWeight: 800,
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 600,
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
  },
  mainContent: {
    flexGrow: 1,
  },
};

export default App;
