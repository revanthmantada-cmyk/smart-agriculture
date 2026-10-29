import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  Info,
  RefreshCw,
  X,
  FileCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Leaf,
  AlertCircle,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import { DiagnoseResponse } from '../types';

export const CropDiagnostics: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [apiResult, setApiResult] = useState<DiagnoseResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024; // 16 MB

  const handleFileSelection = (file: File | undefined) => {
    setValidationError(null);
    setApiResult(null);
    setApiError(null);

    if (!file) return;

    // 1. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError(`Unsupported file format (${file.type || 'unknown'}). Please upload a JPEG, PNG, or WebP image.`);
      return;
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 16 MB.`);
      return;
    }

    if (file.size === 0) {
      setValidationError('The selected image file is empty (0 bytes).');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setValidationError(null);
    setApiResult(null);
    setApiError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleSubmitDiagnosis = async () => {
    if (!selectedFile) {
      setValidationError('Please select or capture a plant photo first.');
      return;
    }

    setIsUploading(true);
    setApiError(null);
    setApiResult(null);

    try {
      const response = await api.uploadCropDiagnosis(selectedFile);
      setApiResult(response);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected error occurred while communicating with the server.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-8">
      {/* Module Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-100">
              <span>Module 1</span>
              <span>•</span>
              <span>Vision Diagnostics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Crop Disease Diagnostics
            </h2>
            <p className="mt-1 text-sm text-stone-600 leading-relaxed max-w-2xl">
              Capture or upload high-resolution leaf photos. The system validates the image and prepares it for plant disease classification.
            </p>
          </div>
          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-emerald-100/70 text-emerald-800 items-center justify-center shrink-0">
            <Camera className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Upload & Camera Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-stone-900">1. Take or Select a Plant Leaf Photo</h3>

        {/* Hidden inputs for Camera and Gallery */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelection(e.target.files?.[0])}
          className="hidden"
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFileSelection(e.target.files?.[0])}
          className="hidden"
        />

        {!previewUrl ? (
          <div className="space-y-4">
            {/* Primary Action Buttons for Mobile & Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 text-white font-semibold text-base shadow-lg shadow-emerald-700/20 hover:from-emerald-700 hover:to-green-800 active:scale-98 transition-all"
              >
                <Camera className="w-6 h-6" />
                <span>Take Photo (Camera)</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-stone-100 text-stone-800 font-semibold text-base hover:bg-stone-200 border border-stone-200 active:scale-98 transition-all"
              >
                <Upload className="w-6 h-6 text-stone-600" />
                <span>Upload from Gallery</span>
              </button>
            </div>

            {/* Desktop Drag & Drop Box */}
            <div
              onClick={() => galleryInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-800">Tap to select or drag and drop an image here</p>
              <p className="text-xs text-stone-500 mt-1">Supports JPEG, PNG, and WebP (up to 16 MB)</p>
            </div>
          </div>
        ) : (
          /* Image Preview and Options */
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 flex items-center justify-center max-h-96">
              <img
                src={previewUrl}
                alt="Selected plant leaf"
                className="w-full h-auto max-h-96 object-contain"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-3 right-3 p-2 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white backdrop-blur shadow-md transition-colors"
                title="Remove photo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File metadata & Replace Options */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold text-stone-900 block truncate max-w-xs">{selectedFile?.name}</span>
                  <span className="text-stone-500">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''} • {selectedFile?.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isUploading}
              onClick={handleSubmitDiagnosis}
              className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-md ${
                isUploading
                  ? 'bg-emerald-300 text-white cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-98 shadow-emerald-700/20'
              }`}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Validating Image with Backend...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Send to Diagnosis Gateway</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Backend API Error Message */}
        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Backend Error</p>
              <p className="mt-0.5">{apiError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Backend Result Card */}
      {apiResult && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">2. Diagnosis Report</h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Validated
            </span>
          </div>

          {/* ── CASE 1: Model loaded + confident prediction ── */}
          {apiResult.model_connected && apiResult.ai_prediction && (
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                apiResult.is_healthy
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-orange-50 border-orange-200 text-orange-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-2 font-bold text-sm">
                {apiResult.is_healthy ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                )}
                <span>{apiResult.is_healthy ? 'Plant Appears Healthy' : 'Potential Disease Detected'}</span>
              </div>

              {/* Predicted class pill */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border font-semibold text-sm shadow-sm">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  {(apiResult.predicted_class ?? '').replace(/__/g, ' — ').replace(/_/g, ' ')}
                </span>
              </div>

              {/* Confidence bar */}
              {apiResult.confidence != null && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Model Confidence</span>
                    <span>{apiResult.confidence_pct}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/60 overflow-hidden border">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        apiResult.is_healthy ? 'bg-emerald-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.round((apiResult.confidence ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Guidance */}
              {apiResult.guidance && (
                <p className="text-sm leading-relaxed">{apiResult.guidance}</p>
              )}

              {/* Disclaimer */}
              {apiResult.disclaimer && (
                <p className="text-[11px] font-semibold opacity-70 uppercase tracking-wider">
                  ⚠ {apiResult.disclaimer}
                </p>
              )}
            </div>
          )}

          {/* ── CASE 2: Model loaded but low confidence ── */}
          {apiResult.model_connected && !apiResult.ai_prediction && (
            <div className="p-5 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-yellow-800">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                <span>Low Confidence — Could Not Make a Reliable Prediction</span>
              </div>
              <p className="text-xs sm:text-sm text-yellow-800/90 leading-relaxed">
                {apiResult.message}
              </p>
              {apiResult.guidance && (
                <p className="text-xs text-yellow-700 font-medium">{apiResult.guidance}</p>
              )}
              <div className="pt-1 text-[11px] font-semibold text-yellow-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>●</span>
                <span>Truth in AI Guarantee: No prediction was generated due to insufficient confidence.</span>
              </div>
            </div>
          )}

          {/* ── CASE 3: Model not loaded ── */}
          {!apiResult.model_connected && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <span>AI Disease Prediction Model: Not Loaded</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800/90 leading-relaxed">
                {apiResult.message}
              </p>
              <div className="pt-2 text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>●</span>
                <span>Truth in AI Guarantee: The system will not generate speculative or hallucinated plant disease diagnoses without an actual trained neural network.</span>
              </div>
            </div>
          )}

          {/* Image Verification Details */}
          {apiResult.file_details && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div>
                <span className="text-stone-500 block">Uploaded File</span>
                <span className="font-semibold text-stone-900 truncate block">{apiResult.file_details.filename}</span>
              </div>
              <div>
                <span className="text-stone-500 block">Detected Format</span>
                <span className="font-semibold text-stone-900">{apiResult.file_details.format}</span>
              </div>
              <div>
                <span className="text-stone-500 block">File Size</span>
                <span className="font-semibold text-stone-900">{apiResult.file_details.size_kb} KB</span>
              </div>
            </div>
          )}

          {/* Supported PlantVillage Classes */}
          {apiResult.supported_disease_classes && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                PlantVillage Disease Classes ({apiResult.supported_disease_classes.length} classes)
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-3 rounded-xl bg-stone-50 border border-stone-200">
                {apiResult.supported_disease_classes.map((cls, idx) => (
                  <span
                    key={idx}
                    className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                      apiResult.ai_prediction === cls
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-white border-stone-200 text-stone-700'
                    }`}
                  >
                    {cls.replace(/__/g, ' — ').replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
