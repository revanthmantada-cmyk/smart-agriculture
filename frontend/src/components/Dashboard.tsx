import React from 'react';
import {
  ScanLine,
  FlaskConical,
  Store,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Database,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { CropBatch, HealthResponse } from '../types';

interface DashboardProps {
  batches: CropBatch[];
  loadingBatches: boolean;
  health: HealthResponse | null;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  batches,
  loadingBatches,
  health,
  onNavigate,
}) => {
  // Aggregate real batch quantities by crop for the chart
  const cropVolumeMap: Record<string, number> = {};
  batches.forEach((b) => {
    cropVolumeMap[b.crop_name] = (cropVolumeMap[b.crop_name] || 0) + b.quantity_kg;
  });

  const chartData = Object.entries(cropVolumeMap).map(([crop, totalKg]) => ({
    crop,
    quantity: Math.round(totalKg),
  }));

  const totalQuantityKg = batches.reduce((sum, b) => sum + b.quantity_kg, 0);
  const activeListingsCount = batches.filter((b) => b.market_listing).length;

  const BAR_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 md:pb-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-950 text-white p-6 sm:p-8 md:p-10 shadow-xl shadow-emerald-900/15">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 backdrop-blur border border-emerald-500/30 text-emerald-200 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Agriculture Hackathon Platform</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Next-Gen Crop Health, Soil Intelligence & Market Tracking
          </h2>
          <p className="mt-2 sm:mt-3 text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            Empowering farmers and agricultural researchers with instant camera diagnostics, scientific soil evaluation, and transparent farm-to-market batch management.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('diagnostics')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-semibold text-sm hover:bg-emerald-50 transition-all shadow-md active:scale-95"
            >
              <ScanLine className="w-4 h-4 text-emerald-700" />
              <span>Diagnose Crop</span>
            </button>
            <button
              onClick={() => onNavigate('soil')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white font-medium text-sm border border-emerald-500/40 transition-all active:scale-95"
            >
              <FlaskConical className="w-4 h-4 text-emerald-300" />
              <span>Analyze Soil NPK</span>
            </button>
            <button
              onClick={() => onNavigate('market')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white font-medium text-sm border border-emerald-500/40 transition-all active:scale-95"
            >
              <Store className="w-4 h-4 text-emerald-300" />
              <span>Track Batches</span>
            </button>
          </div>
        </div>

        {/* Decorative natural background shapes */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-0 -translate-y-10 w-60 h-60 rounded-full bg-green-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Batches</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900">
              {loadingBatches ? '...' : batches.length}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">Harvest records in SQLite</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Yield</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900">
              {loadingBatches ? '...' : `${totalQuantityKg.toLocaleString()} kg`}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">Recorded produce volume</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Market Listings</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900">
              {loadingBatches ? '...' : activeListingsCount}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">Active marketplace items</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Backend Link</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base sm:text-lg font-bold text-stone-900 truncate">
              {health?.database_connected ? 'SQLite Connected' : 'Offline'}
            </div>
            <p className="text-xs text-stone-500 mt-0.5 truncate">
              {health?.dataset_csv_exists ? 'Dataset CSV Loaded' : 'Local Storage'}
            </p>
          </div>
        </div>
      </div>

      {/* Main 3 Module Quick Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-stone-900">Application Modules</h3>
          <span className="text-xs text-stone-500 font-medium">3 Specialized Modules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Module 1 Card */}
          <div
            onClick={() => onNavigate('diagnostics')}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ScanLine className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Module 1
              </span>
              <h4 className="text-base font-bold text-stone-900 mt-2 group-hover:text-emerald-700 transition-colors">
                Crop Diagnostics
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                Take a live plant photo with your phone camera or upload a leaf image to validate disease detection.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Open Scanner</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 2 Card */}
          <div
            onClick={() => onNavigate('soil')}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                Module 2
              </span>
              <h4 className="text-base font-bold text-stone-900 mt-2 group-hover:text-emerald-700 transition-colors">
                Soil Health Analysis
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                Calculate Nitrogen, Phosphorus, Potassium, and pH balance, plus crop suitability baseline matching.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Analyze Soil</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 3 Card */}
          <div
            onClick={() => onNavigate('market')}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Module 3
              </span>
              <h4 className="text-base font-bold text-stone-900 mt-2 group-hover:text-emerald-700 transition-colors">
                Farm-to-Market Tracking
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                Track harvest batches from seed to sale, monitor stage progress, and view live market prices.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>View Batches</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chart Section: Real SQLite Produce Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Crop Volume by Category (kg)</h3>
              <p className="text-xs text-stone-500">Live data loaded from SQLite backend database</p>
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Real Data
            </span>
          </div>

          {loadingBatches ? (
            <div className="h-56 flex items-center justify-center text-xs text-stone-400 animate-pulse">
              Loading crop volume data...
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="crop" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => [`${val.toLocaleString()} kg`, 'Quantity']}
                  />
                  <Bar dataKey="quantity" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4">
              <Layers className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-xs text-stone-500">No crop batches found in the database yet.</p>
            </div>
          )}
        </div>

        {/* Recent Batches Quick Preview */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-stone-900">Recent Batches</h3>
              <button
                onClick={() => onNavigate('market')}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {loadingBatches ? (
                <div className="text-xs text-stone-400 py-6 text-center">Loading recent batches...</div>
              ) : batches.length > 0 ? (
                batches.slice(0, 3).map((b) => (
                  <div
                    key={b.batch_id}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 hover:bg-emerald-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">{b.crop_name}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'harvested'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'market_ready'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-stone-500">
                      <span className="font-medium text-stone-700">{b.quantity_kg.toLocaleString()} kg</span>
                      <span className="truncate max-w-[120px]">{b.farm_location || 'Local Farm'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 py-4 text-center">No recent batches.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('market')}
            className="w-full mt-4 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Manage All Batches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
