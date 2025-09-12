import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import Layout from './components/Layout';
import Dashboard, { DashboardRef } from './components/Dashboard';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Products from './components/Products';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <AppLayout />;
};

const AppLayout: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  
  // Reference to the Dashboard component
  const dashboardRef = React.useRef<DashboardRef>(null);
  
  const handleSync = async () => {
    if (dashboardRef.current) {
      setSyncing(true);
      await dashboardRef.current.triggerSync();
      setSyncing(false);
    }
  };
  
  const handleSyncStart = () => {
    setSyncing(true);
  };
  
  const handleSyncComplete = (success: boolean, time: Date) => {
    setSyncing(false);
    setLastSyncTime(time);
  };
  
  return (
    <Layout 
      onSync={handleSync}
      syncing={syncing}
      lastSyncTime={lastSyncTime}
    >
      <Routes>
        <Route path="/dashboard" element={
          <Dashboard 
            onSyncStart={handleSyncStart}
            onSyncComplete={handleSyncComplete}
            syncing={syncing}
            ref={dashboardRef}
          />
        } />
        <Route path="/customers" element={<Customers />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/products" element={<Products />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;