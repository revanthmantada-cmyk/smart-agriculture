import React, { useState } from 'react';
import {
  FlaskConical,
  Sprout,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  CloudRain,
  Droplets,
  Info,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import {
  SoilAnalysisRequest,
  SoilAnalysisResponse,
  CropRecommendationRequest,
  CropRecommendationResponse,
} from '../types';

export const SoilHealth: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'soil_analysis' | 'crop_recommendation'>('soil_analysis');

  // Soil Analysis Form State
  const [soilForm, setSoilForm] = useState<SoilAnalysisRequest>({
    nitrogen: 85,
    phosphorus: 45,
    potassium: 50,
    ph: 6.8,
  });
  const [soilLoading, setSoilLoading] = useState<boolean>(false);
  const [soilResult, setSoilResult] = useState<SoilAnalysisResponse | null>(null);
  const [soilError, setSoilError] = useState<string | null>(null);

  // Crop Recommendation Form State
  const [cropForm, setCropForm] = useState<CropRecommendationRequest>({
    nitrogen: 90,
    phosphorus: 42,
    potassium: 43,
    temperature: 21.0,
    humidity: 82.0,
    ph: 6.5,
    rainfall: 202.9,
  });
  const [cropLoading, setCropLoading] = useState<boolean>(false);
  const [cropResult, setCropResult] = useState<CropRecommendationResponse | null>(null);
  const [cropError, setCropError] = useState<string | null>(null);

  // Presets for quick hackathon demos
  const applyPreset = (presetName: string) => {
    if (presetName === 'rice') {
      setSoilForm({ nitrogen: 80, phosphorus: 45, potassium: 40, ph: 6.5 });
      setCropForm({ nitrogen: 80, phosphorus: 45, potassium: 40, temperature: 24, humidity: 80, ph: 6.5, rainfall: 220 });
    } else if (presetName === 'potato') {
      setSoilForm({ nitrogen: 40, phosphorus: 70, potassium: 50, ph: 5.8 });
      setCropForm({ nitrogen: 40, phosphorus: 70, potassium: 50, temperature: 18, humidity: 65, ph: 5.8, rainfall: 100 });
    } else if (presetName === 'vegetable') {
      setSoilForm({ nitrogen: 110, phosphorus: 55, potassium: 80, ph: 7.2 });
      setCropForm({ nitrogen: 110, phosphorus: 55, potassium: 80, temperature: 26, humidity: 70, ph: 7.2, rainfall: 140 });
    }
  };

  const handleSoilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSoilLoading(true);
    setSoilError(null);
    setSoilResult(null);

    // Validation
    if (soilForm.ph < 0 || soilForm.ph > 14) {
      setSoilError('Soil pH must be between 0.0 and 14.0.');
      setSoilLoading(false);
      return;
    }
    if (soilForm.nitrogen < 0 || soilForm.phosphorus < 0 || soilForm.potassium < 0) {
      setSoilError('Nutrient values (N, P, K) cannot be negative.');
      setSoilLoading(false);
      return;
    }

    try {
      const res = await api.analyzeSoil(soilForm);
      setSoilResult(res);
    } catch (err: unknown) {
      setSoilError(err instanceof ApiError ? err.message : 'Failed to analyze soil measurements.');
    } finally {
      setSoilLoading(false);
    }
  };

  const handleCropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCropLoading(true);
    setCropError(null);
    setCropResult(null);

    try {
      const res = await api.recommendCrop(cropForm);
      setCropResult(res);
    } catch (err: unknown) {
      setCropError(err instanceof ApiError ? err.message : 'Failed to fetch crop recommendation.');
    } finally {
      setCropLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-8">
      {/* Module Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
              <span>Module 2</span>
              <span>•</span>
              <span>Soil & Agronomy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Soil Health & Crop Suitability
            </h2>
            <p className="mt-1 text-sm text-stone-600 leading-relaxed max-w-2xl">
              Evaluate soil nutrients (N, P, K) and pH levels, and look up suitable crops based on agro-climatic conditions loaded from the dataset.
            </p>
          </div>
          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-amber-100/70 text-amber-800 items-center justify-center shrink-0">
            <FlaskConical className="w-8 h-8" />
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-6 flex border-b border-stone-200 gap-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('soil_analysis')}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'soil_analysis'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Soil Nutrient Analysis (NPK + pH)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('crop_recommendation')}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'crop_recommendation'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Crop Suitability Lookup</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons for Demo */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-stone-500 font-medium shrink-0">Demo Presets:</span>
        <button
          type="button"
          onClick={() => applyPreset('rice')}
          className="px-3 py-1 rounded-full bg-white border border-stone-300 hover:border-emerald-500 hover:bg-emerald-50 font-medium text-stone-700 transition-colors shrink-0"
        >
          🌾 Wet Paddy / Rice
        </button>
        <button
          type="button"
          onClick={() => applyPreset('potato')}
          className="px-3 py-1 rounded-full bg-white border border-stone-300 hover:border-emerald-500 hover:bg-emerald-50 font-medium text-stone-700 transition-colors shrink-0"
        >
          🥔 Cool Soil / Potato
        </button>
        <button
          type="button"
          onClick={() => applyPreset('vegetable')}
          className="px-3 py-1 rounded-full bg-white border border-stone-300 hover:border-emerald-500 hover:bg-emerald-50 font-medium text-stone-700 transition-colors shrink-0"
        >
          🥦 Rich Garden / Vegetables
        </button>
      </div>

      {/* TAB 1: SOIL NUTRIENT ANALYSIS */}
      {activeSubTab === 'soil_analysis' && (
        <div className="space-y-6">
          <form onSubmit={handleSoilSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Enter Soil Chemistry Parameters</h3>
              <span className="text-xs text-stone-500">Standard Test Values</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Nitrogen */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Nitrogen (N)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={soilForm.nitrogen}
                    onChange={(e) => setSoilForm({ ...soilForm, nitrogen: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 85"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-400 font-medium">mg/kg</span>
                </div>
                <p className="text-[11px] text-stone-500">Ideal range: 50 – 100 mg/kg</p>
              </div>

              {/* Phosphorus */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Phosphorus (P)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={soilForm.phosphorus}
                    onChange={(e) => setSoilForm({ ...soilForm, phosphorus: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 45"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-400 font-medium">mg/kg</span>
                </div>
                <p className="text-[11px] text-stone-500">Ideal range: 30 – 60 mg/kg</p>
              </div>

              {/* Potassium */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Potassium (K)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={soilForm.potassium}
                    onChange={(e) => setSoilForm({ ...soilForm, potassium: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 50"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-400 font-medium">mg/kg</span>
                </div>
                <p className="text-[11px] text-stone-500">Ideal range: 35 – 70 mg/kg</p>
              </div>

              {/* pH Level */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Soil pH Level
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={soilForm.ph}
                    onChange={(e) => setSoilForm({ ...soilForm, ph: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 6.8"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-400 font-medium">0 - 14</span>
                </div>
                <p className="text-[11px] text-stone-500">Neutral: 6.0 – 7.5</p>
              </div>
            </div>

            {/* Error Message */}
            {soilError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <span>{soilError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={soilLoading}
              className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-md ${
                soilLoading
                  ? 'bg-emerald-300 text-white cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-98 shadow-emerald-700/20'
              }`}
            >
              {soilLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Evaluating Nutrient Levels...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-5 h-5" />
                  <span>Calculate Soil Nutrient Assessment</span>
                </>
              )}
            </button>
          </form>

          {/* Result Card for Soil Analysis */}
          {soilResult && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900">Soil Nutrient Report</h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Assessment Complete
                </span>
              </div>

              {/* Distinction Banner: Preliminary vs Certified Lab Testing */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="font-bold">Preliminary Field Evaluation Notice</p>
                  <p className="text-blue-800/90 leading-relaxed">
                    {soilResult.message}
                  </p>
                </div>
              </div>

              {/* Nutrient Level Badges */}
              {soilResult.nutrient_assessment && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                    <span className="text-xs text-stone-500 uppercase font-bold tracking-wider block">Nitrogen</span>
                    <span className="text-lg font-extrabold text-stone-900 mt-1 block">
                      {soilResult.nutrient_assessment.nitrogen_level}
                    </span>
                    <span className="text-[11px] text-stone-500">{soilResult.input_measurements?.nitrogen} mg/kg</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                    <span className="text-xs text-stone-500 uppercase font-bold tracking-wider block">Phosphorus</span>
                    <span className="text-lg font-extrabold text-stone-900 mt-1 block">
                      {soilResult.nutrient_assessment.phosphorus_level}
                    </span>
                    <span className="text-[11px] text-stone-500">{soilResult.input_measurements?.phosphorus} mg/kg</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                    <span className="text-xs text-stone-500 uppercase font-bold tracking-wider block">Potassium</span>
                    <span className="text-lg font-extrabold text-stone-900 mt-1 block">
                      {soilResult.nutrient_assessment.potassium_level}
                    </span>
                    <span className="text-[11px] text-stone-500">{soilResult.input_measurements?.potassium} mg/kg</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                    <span className="text-xs text-stone-500 uppercase font-bold tracking-wider block">pH Level</span>
                    <span className="text-lg font-extrabold text-stone-900 mt-1 block">
                      {soilResult.nutrient_assessment.ph_level}
                    </span>
                    <span className="text-[11px] text-stone-500">pH {soilResult.input_measurements?.ph}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CROP SUITABILITY RECOMMENDATION */}
      {activeSubTab === 'crop_recommendation' && (
        <div className="space-y-6">
          <form onSubmit={handleCropSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">Agro-Climatic Suitability Inputs</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Matches conditions against 2,200 empirical field samples in <code className="bg-stone-100 px-1 py-0.5 rounded">Crop_recommendation.csv</code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="text-xs font-bold text-stone-700 block">Nitrogen (N)</label>
                <input
                  type="number"
                  step="any"
                  value={cropForm.nitrogen}
                  onChange={(e) => setCropForm({ ...cropForm, nitrogen: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-semibold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="text-xs font-bold text-stone-700 block">Phosphorus (P)</label>
                <input
                  type="number"
                  step="any"
                  value={cropForm.phosphorus}
                  onChange={(e) => setCropForm({ ...cropForm, phosphorus: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-semibold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="text-xs font-bold text-stone-700 block">Potassium (K)</label>
                <input
                  type="number"
                  step="any"
                  value={cropForm.potassium}
                  onChange={(e) => setCropForm({ ...cropForm, potassium: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-semibold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="text-xs font-bold text-stone-700 block">Soil pH</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={cropForm.ph}
                  onChange={(e) => setCropForm({ ...cropForm, ph: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-semibold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Temperature (°C)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={cropForm.temperature}
                  onChange={(e) => setCropForm({ ...cropForm, temperature: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-semibold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>Humidity (%)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={cropForm.humidity}
                  onChange={(e) => setCropForm({ ...cropForm, humidity: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-semibold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rainfall (mm)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={cropForm.rainfall}
                  onChange={(e) => setCropForm({ ...cropForm, rainfall: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-semibold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {cropError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <span>{cropError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cropLoading}
              className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-md ${
                cropLoading
                  ? 'bg-emerald-300 text-white cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-98 shadow-emerald-700/20'
              }`}
            >
              {cropLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Querying Dataset Baseline...</span>
                </>
              ) : (
                <>
                  <Sprout className="w-5 h-5" />
                  <span>Find Suitable Crop Matches</span>
                </>
              )}
            </button>
          </form>

          {/* Crop Recommendation Result */}
          {cropResult && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900">Dataset Baseline Match Results</h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Loaded
                </span>
              </div>

              {/* Honest AI Model Disclaimer */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="font-bold">Model Connection Status</p>
                  <p className="text-amber-800/90 leading-relaxed">
                    {cropResult.notice}
                  </p>
                </div>
              </div>

              {/* Top Matches Cards */}
              {cropResult.statistical_reference_matches && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Closest Empirical Crop Profiles
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cropResult.statistical_reference_matches.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all ${
                          idx === 0
                            ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-400 shadow-sm'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700">
                            Rank #{idx + 1}
                          </span>
                          <span className="text-xs text-stone-500 font-medium">
                            Distance: {item.distance_score}
                          </span>
                        </div>
                        <h5 className="text-xl font-extrabold text-stone-900 capitalize">
                          {item.crop}
                        </h5>
                        <p className="text-xs text-stone-500 mt-1">Typical requirement benchmarks:</p>
                        <div className="mt-3 grid grid-cols-2 gap-1 text-[11px] text-stone-600">
                          <div>N: <strong className="text-stone-800">{item.typical_requirements.N}</strong></div>
                          <div>P: <strong className="text-stone-800">{item.typical_requirements.P}</strong></div>
                          <div>K: <strong className="text-stone-800">{item.typical_requirements.K}</strong></div>
                          <div>pH: <strong className="text-stone-800">{item.typical_requirements.ph}</strong></div>
                          <div>Temp: <strong className="text-stone-800">{item.typical_requirements.temperature}°C</strong></div>
                          <div>Rain: <strong className="text-stone-800">{item.typical_requirements.rainfall}mm</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
