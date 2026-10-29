import {
  HealthResponse,
  DiagnoseResponse,
  SoilAnalysisRequest,
  SoilAnalysisResponse,
  CropRecommendationRequest,
  CropRecommendationResponse,
  MarketBatchesResponse,
  CreateBatchRequest,
} from '../types';

// Use environment variable or default to relative /api (proxied via Vite)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Generic helper for JSON fetch requests
 */
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `Server returned error (${res.status} ${res.statusText})`;
      throw new ApiError(errorMsg, res.status);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new ApiError(
        'Unable to reach backend server. Please verify Flask is running on http://127.0.0.1:5000.',
        0
      );
    }
    throw new ApiError(err instanceof Error ? err.message : 'Unknown network error', 500);
  }
}

export const api = {
  /**
   * Health Check
   */
  async getHealth(): Promise<HealthResponse> {
    return fetchJson<HealthResponse>('/health');
  },

  /**
   * Module 1: Crop Diagnostics Image Upload
   */
  async uploadCropDiagnosis(imageFile: File): Promise<DiagnoseResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const res = await fetch(`${API_BASE}/diagnose`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new ApiError(data?.error || `Upload failed with status ${res.status}`, res.status);
      }

      return data as DiagnoseResponse;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        'Unable to send image to Flask backend. Make sure the server is running on http://127.0.0.1:5000.',
        0
      );
    }
  },

  /**
   * Module 2: Soil Health Analysis
   */
  async analyzeSoil(payload: SoilAnalysisRequest): Promise<SoilAnalysisResponse> {
    return fetchJson<SoilAnalysisResponse>('/soil-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Module 2 (Advanced): Crop Recommendation Lookup
   */
  async recommendCrop(payload: CropRecommendationRequest): Promise<CropRecommendationResponse> {
    return fetchJson<CropRecommendationResponse>('/recommend-crop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Module 3: Farm-to-Market Batches
   */
  async getMarketBatches(status?: string): Promise<MarketBatchesResponse> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return fetchJson<MarketBatchesResponse>(`/market/batches${query}`);
  },

  /**
   * Module 3: Create a new produce batch
   */
  async createMarketBatch(payload: CreateBatchRequest): Promise<{ success: boolean; message: string; batch_id: string }> {
    return fetchJson<{ success: boolean; message: string; batch_id: string }>('/market/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};
