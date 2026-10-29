import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CropDiagnostics } from './components/CropDiagnostics';
import { SoilHealth } from './components/SoilHealth';
import { FarmToMarket } from './components/FarmToMarket';
import { api, ApiError } from './services/api';
import { CropBatch, HealthResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Backend Health State
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Batches State
  const [batches, setBatches] = useState<CropBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState<boolean>(true);
  const [batchesError, setBatchesError] = useState<string | null>(null);

  // Health fetch function
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Batches fetch function
  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    setBatchesError(null);
    try {
      const res = await api.getMarketBatches();
      setBatches(res.batches || []);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBatchesError(err.message);
      } else {
        setBatchesError('Could not load batches from database.');
      }
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchBatches();
  }, [fetchHealth, fetchBatches]);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Top Navbar & Connectivity Badge */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        healthLoading={healthLoading}
        onRefreshHealth={fetchHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            batches={batches}
            loadingBatches={loadingBatches}
            health={health}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'diagnostics' && <CropDiagnostics />}

        {activeTab === 'soil' && <SoilHealth />}

        {activeTab === 'market' && (
          <FarmToMarket
            batches={batches}
            loadingBatches={loadingBatches}
            batchesError={batchesError}
            onRefreshBatches={fetchBatches}
          />
        )}
      </main>

      {/* Clean Hackathon Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">🌱 AgriSmart AI Suite</span>
            <span>•</span>
            <span>Hackathon Project</span>
          </div>
          <div>
            <span>Powered by React, TypeScript, Python Flask & SQLite</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
