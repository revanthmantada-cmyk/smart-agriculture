import React, { useState } from 'react';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  Calendar,
  AlertTriangle,
  Phone,
  X,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import { CropBatch, CreateBatchRequest } from '../types';

interface FarmToMarketProps {
  batches: CropBatch[];
  loadingBatches: boolean;
  batchesError: string | null;
  onRefreshBatches: () => void;
}

export const FarmToMarket: React.FC<FarmToMarketProps> = ({
  batches,
  loadingBatches,
  batchesError,
  onRefreshBatches,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New batch form state
  const [newBatch, setNewBatch] = useState<CreateBatchRequest>({
    batch_id: '',
    crop_name: '',
    variety: '',
    quantity_kg: 100,
    farm_location: '',
    status: 'planted',
    notes: '',
  });
  const [submittingBatch, setSubmittingBatch] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Status stage definitions
  const statusColors: Record<string, string> = {
    planted: 'bg-stone-100 text-stone-700 border-stone-300',
    growing: 'bg-amber-100 text-amber-800 border-amber-300',
    harvested: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    in_transit: 'bg-purple-100 text-purple-800 border-purple-300',
    market_ready: 'bg-blue-100 text-blue-800 border-blue-300',
    sold: 'bg-stone-200 text-stone-600 border-stone-300',
  };

  const filteredBatches = batches.filter((b) => {
    const matchesFilter = selectedFilter === 'all' || b.status === selectedFilter;
    const matchesSearch =
      b.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.batch_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.farm_location && b.farm_location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!newBatch.batch_id.trim() || !newBatch.crop_name.trim()) {
      setModalError('Batch ID and Crop Name are required.');
      return;
    }

    if (newBatch.quantity_kg <= 0) {
      setModalError('Quantity must be greater than zero.');
      return;
    }

    setSubmittingBatch(true);
    try {
      const res = await api.createMarketBatch(newBatch);
      setModalSuccess(res.message);
      onRefreshBatches();
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(null);
        setNewBatch({
          batch_id: '',
          crop_name: '',
          variety: '',
          quantity_kg: 100,
          farm_location: '',
          status: 'planted',
          notes: '',
        });
      }, 1200);
    } catch (err: unknown) {
      setModalError(err instanceof ApiError ? err.message : 'Failed to create new batch.');
    } finally {
      setSubmittingBatch(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 md:pb-8">
      {/* Module Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200">
            <span>Module 3</span>
            <span>•</span>
            <span>Supply Chain & Marketplace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Farm-to-Market Tracking
          </h2>
          <p className="mt-1 text-sm text-stone-600 leading-relaxed max-w-2xl">
            Live lifecycle traceability from nursery planting through harvest and marketplace listing, backed by SQLite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshBatches}
            className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Refresh Batches"
          >
            <RefreshCw className={`w-5 h-5 ${loadingBatches ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>New Batch</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by crop, batch ID, or farm..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['all', 'planted', 'growing', 'harvested', 'market_ready'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize whitespace-nowrap transition-colors ${
                selectedFilter === st
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st === 'all' ? 'All Batches' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {batchesError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{batchesError}</span>
          </div>
          <button
            onClick={onRefreshBatches}
            className="px-3 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 font-semibold hover:bg-rose-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Batches Grid */}
      {loadingBatches ? (
        <div className="py-16 text-center text-sm text-stone-400 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <span>Fetching crop batches from SQLite database...</span>
        </div>
      ) : filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map((b) => (
            <div
              key={b.batch_id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header with Batch ID & Status Pill */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    {b.batch_id}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                      statusColors[b.status] || 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {b.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Crop Name & Variety */}
                <h4 className="text-xl font-extrabold text-stone-900 tracking-tight">
                  {b.crop_name}
                </h4>
                {b.variety && (
                  <p className="text-xs text-stone-500 font-medium">{b.variety}</p>
                )}

                {/* Key Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-2xl border border-stone-200/70">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Quantity</span>
                    <span className="font-bold text-stone-900 text-sm">{b.quantity_kg.toLocaleString()} kg</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Planted Date</span>
                    <span className="font-medium text-stone-800">{b.planted_date || 'N/A'}</span>
                  </div>
                </div>

                {/* Location & Harvest Date */}
                <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                  {b.farm_location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{b.farm_location}</span>
                    </div>
                  )}
                  {b.harvest_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Harvested: {b.harvest_date}</span>
                    </div>
                  )}
                </div>

                {/* Notes if present */}
                {b.notes && (
                  <p className="mt-2 text-xs text-stone-500 italic bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                    "{b.notes}"
                  </p>
                )}
              </div>

              {/* Market Listing Footer */}
              <div className="mt-5 pt-4 border-t border-stone-100">
                {b.market_listing ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">
                        Listed Price
                      </span>
                      <span className="text-base font-extrabold text-emerald-800">
                        ₹{b.market_listing.price_per_kg} / kg
                      </span>
                    </div>
                    {b.market_listing.contact_phone && (
                      <div className="text-right text-[11px] text-stone-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{b.market_listing.contact_phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>No market price listed</span>
                    <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded">Farm Storage</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-stone-800">No Batches Found</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            No crop batches match your current filter or search criteria. Register a new batch to get started!
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Batch</span>
          </button>
        </div>
      )}

      {/* Register New Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900">Register New Crop Batch</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Batch ID *</label>
                  <input
                    type="text"
                    value={newBatch.batch_id}
                    onChange={(e) => setNewBatch({ ...newBatch, batch_id: e.target.value })}
                    placeholder="e.g. BATCH-2026-004"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    value={newBatch.crop_name}
                    onChange={(e) => setNewBatch({ ...newBatch, crop_name: e.target.value })}
                    placeholder="e.g. Tomato"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Variety</label>
                  <input
                    type="text"
                    value={newBatch.variety}
                    onChange={(e) => setNewBatch({ ...newBatch, variety: e.target.value })}
                    placeholder="e.g. Cherry / Roma"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Quantity (kg) *</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={newBatch.quantity_kg}
                    onChange={(e) => setNewBatch({ ...newBatch, quantity_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Planted Date</label>
                  <input
                    type="date"
                    value={newBatch.planted_date || ''}
                    onChange={(e) => setNewBatch({ ...newBatch, planted_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Initial Status</label>
                  <select
                    value={newBatch.status}
                    onChange={(e) => setNewBatch({ ...newBatch, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  >
                    <option value="planted">Planted</option>
                    <option value="growing">Growing</option>
                    <option value="harvested">Harvested</option>
                    <option value="market_ready">Market Ready</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Farm Location</label>
                <input
                  type="text"
                  value={newBatch.farm_location}
                  onChange={(e) => setNewBatch({ ...newBatch, farm_location: e.target.value })}
                  placeholder="e.g. Green Valley Farm, Plot 3"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newBatch.notes}
                  onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
                  placeholder="e.g. Organic fertilizer applied, certified non-GMO."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {modalError}
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  {modalSuccess}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBatch}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-md disabled:opacity-50"
                >
                  {submittingBatch ? 'Saving...' : 'Save to SQLite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
