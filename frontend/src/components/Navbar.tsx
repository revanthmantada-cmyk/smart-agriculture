import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  FlaskConical,
  Store,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { HealthResponse } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthResponse | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  healthLoading,
  onRefreshHealth,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'diagnostics', label: 'Crop Diagnostics', icon: ScanLine },
    { id: 'soil', label: 'Soil Health', icon: FlaskConical },
    { id: 'market', label: 'Farm-to-Market', icon: Store },
  ];

  const isConnected = !!health && health.database_connected;

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                <span className="text-xl">🌱</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-stone-900 tracking-tight">AgriSmart</h1>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Hackathon
                  </span>
                </div>
                <p className="text-xs text-stone-500 hidden sm:block">AI-Powered Agriculture Suite</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1.5 rounded-xl border border-stone-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-white text-emerald-800 shadow-sm shadow-stone-200 font-semibold'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-stone-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Backend Connectivity Status Pill */}
            <div className="flex items-center gap-2">
              <button
                onClick={onRefreshHealth}
                title="Refresh Backend Health Status"
                className={`flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium border transition-all ${
                  healthLoading
                    ? 'bg-stone-100 border-stone-200 text-stone-600'
                    : isConnected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                }`}
              >
                {healthLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-500" />
                ) : isConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <Wifi className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
                    <span>Backend Active</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                    <span>Backend Offline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Backend Offline Global Warning Banner */}
      {!healthLoading && !isConnected && (
        <div className="bg-rose-600 text-white text-xs sm:text-sm font-medium py-2 px-4 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Flask backend is unreachable on <code className="bg-rose-700 px-1 py-0.5 rounded">http://127.0.0.1:5000</code>. Please run <code className="bg-rose-700 px-1 py-0.5 rounded">python app.py</code> in the backend directory.
              </span>
            </div>
            <button
              onClick={onRefreshHealth}
              className="px-2.5 py-0.5 rounded bg-white text-rose-700 font-semibold text-xs hover:bg-rose-50 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Fixed for phones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-stone-200 shadow-lg px-2 py-1 safe-area-pb">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  active
                    ? 'text-emerald-700 font-bold bg-emerald-50/80'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-emerald-600 stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span className="text-[10px] leading-tight text-center truncate max-w-full">
                  {item.label === 'Crop Diagnostics' ? 'Diagnostics' : item.label === 'Farm-to-Market' ? 'Market' : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
