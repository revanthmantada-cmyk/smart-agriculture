// Type definitions matching Flask backend endpoints

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database_connected: boolean;
  dataset_csv_exists: boolean;
  models_dir_exists: boolean;
}

export interface DiagnoseResponse {
  success: boolean;
  error?: string;
  model_connected: boolean;
  ai_prediction: string | null;
  predicted_class?: string | null;
  confidence?: number | null;
  confidence_pct?: string;
  is_healthy?: boolean | null;
  message: string;
  guidance?: string | null;
  disclaimer?: string;
  file_details?: {
    filename: string;
    format: string;
    size_bytes: number;
    size_kb: number;
  };
  supported_disease_classes?: string[];
}

export interface SoilAnalysisRequest {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
}

export interface SoilAnalysisResponse {
  success: boolean;
  error?: string;
  model_connected: boolean;
  input_measurements?: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
  };
  nutrient_assessment?: {
    nitrogen_level: string;
    phosphorus_level: string;
    potassium_level: string;
    ph_level: string;
  };
  message?: string;
}

export interface CropRecommendationRequest {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface StatisticalMatch {
  crop: string;
  distance_score: number;
  typical_requirements: {
    N: number;
    P: number;
    K: number;
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
  };
}

export interface CropRecommendationResponse {
  success: boolean;
  error?: string;
  model_connected: boolean;
  ai_prediction: string | null;
  notice: string;
  user_input?: Record<string, number>;
  statistical_reference_matches?: StatisticalMatch[];
}

export interface MarketListing {
  price_per_kg: number;
  currency: string;
  listing_status: string;
  contact_phone?: string;
}

export interface CropBatch {
  id: number;
  batch_id: string;
  crop_name: string;
  variety: string | null;
  planted_date: string | null;
  harvest_date: string | null;
  quantity_kg: number;
  farm_location: string | null;
  status: 'planted' | 'growing' | 'harvested' | 'in_transit' | 'market_ready' | 'sold';
  notes: string | null;
  created_at: string;
  market_listing?: MarketListing | null;
}

export interface MarketBatchesResponse {
  success: boolean;
  error?: string;
  count: number;
  batches: CropBatch[];
}

export interface CreateBatchRequest {
  batch_id: string;
  crop_name: string;
  variety?: string;
  planted_date?: string;
  harvest_date?: string;
  quantity_kg: number;
  farm_location?: string;
  status: string;
  notes?: string;
}
