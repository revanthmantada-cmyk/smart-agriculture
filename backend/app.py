"""
Smart Agriculture Hackathon - Backend REST API
================================================
A beginner-friendly Flask application providing APIs for:
  1. Crop Diagnostics (MobileNetV2 plant disease AI - connected)
  2. Soil Health Analysis (NPK & pH validation and evaluation)
  3. Crop Recommendation (Reference dataset loader - statistical baseline)
  4. Farm-to-Market Tracking (SQLite CRUD for harvest batches & listings)

All paths are relative to the project root for maximum portability.
"""

import os
import io
import csv
import json
import math
import sqlite3
import numpy as np
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# ---------------------------------------------------------------------------
# TensorFlow / Pillow imports (optional — graceful fallback if not installed)
# ---------------------------------------------------------------------------
try:
    import tensorflow as tf
    from PIL import Image
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_preprocess
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("[MODEL] TensorFlow or Pillow not installed. Running without AI prediction.")

# ------------------------------------------------------------------------------
# 1. Project Paths (Always relative to project root)
# ------------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
DATABASE_PATH = BACKEND_DIR / "smart_agriculture.db"
DATASETS_DIR = PROJECT_ROOT / "datasets"
MODELS_DIR = PROJECT_ROOT / "models"
CROP_DATASET_CSV = DATASETS_DIR / "Crop_recommendation.csv"

# Trained plant disease model paths
MODEL_PATH = MODELS_DIR / "plant_disease_mobilenetv2.keras"
CLASS_INDICES_PATH = MODELS_DIR / "class_indices.json"
IMAGE_SIZE = (224, 224)           # MobileNetV2 input size
CONFIDENCE_THRESHOLD = 0.45       # Below this, return an honest "uncertain" result

# ------------------------------------------------------------------------------
# 2. Flask Application Setup
# ------------------------------------------------------------------------------
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS) so React frontend can connect
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Allowed image file extensions for crop diagnosis
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_IMAGE_SIZE_BYTES = 16 * 1024 * 1024  # 16 MB max upload size

# Target PlantVillage crop disease classes extracted in Step 1
PLANT_VILLAGE_CLASSES = [
    "Pepper__bell___Bacterial_spot",
    "Pepper__bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Tomato_Bacterial_spot",
    "Tomato_Early_blight",
    "Tomato_Late_blight",
    "Tomato_Leaf_Mold",
    "Tomato_Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite",
    "Tomato__Target_Spot",
    "Tomato__Tomato_mosaic_virus",
    "Tomato__Tomato_YellowLeaf__Curl_Virus",
    "Tomato_healthy"
]

# ------------------------------------------------------------------------------
# 3. Load the Trained Disease Model Once at Startup
# ------------------------------------------------------------------------------
# These globals are set once when the server starts. Loading once avoids the
# several-second delay that would happen if we loaded the model on every request.
DISEASE_MODEL = None
CLASS_LABELS = []

def load_disease_model():
    """
    Attempt to load the trained MobileNetV2 plant disease model and class labels.
    Sets globals DISEASE_MODEL and CLASS_LABELS. Safe to call at startup.
    """
    global DISEASE_MODEL, CLASS_LABELS

    if not TF_AVAILABLE:
        print("[MODEL] TensorFlow unavailable — skipping model load.")
        return

    if not MODEL_PATH.exists():
        print(f"[MODEL] Model file not found: {MODEL_PATH}")
        print("[MODEL] Run `python backend/train_model.py` to train and save the model first.")
        return

    if not CLASS_INDICES_PATH.exists():
        print(f"[MODEL] Class-index file not found: {CLASS_INDICES_PATH}")
        return

    try:
        print(f"[MODEL] Loading model from {MODEL_PATH} ...")
        DISEASE_MODEL = tf.keras.models.load_model(str(MODEL_PATH))
        with open(CLASS_INDICES_PATH, "r", encoding="utf-8") as f:
            CLASS_LABELS = json.load(f)   # ordered list of class name strings
        print(f"[MODEL] Plant disease model loaded successfully. {len(CLASS_LABELS)} classes.")
    except Exception as exc:
        DISEASE_MODEL = None
        CLASS_LABELS = []
        print(f"[MODEL] ERROR loading model: {exc}")


# Load model when this module is imported (i.e., when Flask starts)
load_disease_model()


# ------------------------------------------------------------------------------
# 3. Database Helper Functions
# ------------------------------------------------------------------------------
def get_db_connection():
    """Create and return a connection to the SQLite database with row factory."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Enables dict-like access: row["crop_name"]
    return conn


def init_db():
    """Initialize SQLite database with required tables and initial sample data."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Table 1: crop_batches (Stores individual harvests/crops from farmers)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS crop_batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT UNIQUE NOT NULL,
            crop_name TEXT NOT NULL,
            variety TEXT,
            planted_date TEXT,
            harvest_date TEXT,
            quantity_kg REAL NOT NULL,
            farm_location TEXT,
            status TEXT NOT NULL DEFAULT 'planted',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Table 2: market_listings (Produce listed for sale in the market)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS market_listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT NOT NULL,
            crop_name TEXT NOT NULL,
            quantity_kg REAL NOT NULL,
            price_per_kg REAL NOT NULL,
            currency TEXT DEFAULT 'INR',
            listing_status TEXT DEFAULT 'active',
            contact_phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES crop_batches (batch_id)
        );
    """)

    # Table 3: batch_status_history (Audit timeline for farm-to-market tracking)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS batch_status_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT NOT NULL,
            status TEXT NOT NULL,
            stage_notes TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES crop_batches (batch_id)
        );
    """)

    # Check if we should insert initial beginner demo batches
    cursor.execute("SELECT COUNT(*) FROM crop_batches")
    count = cursor.fetchone()[0]

    if count == 0:
        sample_batches = [
            (
                "BATCH-2026-001",
                "Tomato",
                "Roma Hybrid",
                "2026-08-10",
                "2026-10-25",
                450.0,
                "Green Valley Farm, Sector 4",
                "harvested",
                "First seasonal harvest. Excellent quality, pesticide-free."
            ),
            (
                "BATCH-2026-002",
                "Bell Pepper",
                "California Wonder",
                "2026-08-20",
                "2026-10-27",
                200.0,
                "Sunrise Organics, Plot 12",
                "market_ready",
                "Grade-A green capsicum sorted and crated."
            ),
            (
                "BATCH-2026-003",
                "Potato",
                "Kufri Jyoti",
                "2026-09-01",
                None,
                1200.0,
                "Highland Farm, North Field",
                "growing",
                "Tuber formation stage. Irrigation scheduled weekly."
            )
        ]

        cursor.executemany("""
            INSERT INTO crop_batches 
            (batch_id, crop_name, variety, planted_date, harvest_date, quantity_kg, farm_location, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_batches)

        # Seed initial listings
        cursor.execute("""
            INSERT INTO market_listings 
            (batch_id, crop_name, quantity_kg, price_per_kg, currency, listing_status, contact_phone)
            VALUES 
            ('BATCH-2026-001', 'Tomato', 450.0, 32.50, 'INR', 'active', '+91 98765 43210'),
            ('BATCH-2026-002', 'Bell Pepper', 200.0, 55.00, 'INR', 'active', '+91 98765 43211')
        """)

        # Seed status history
        cursor.execute("""
            INSERT INTO batch_status_history (batch_id, status, stage_notes)
            VALUES 
            ('BATCH-2026-001', 'planted', 'Seeds sown in nursery'),
            ('BATCH-2026-001', 'growing', 'Vegetative growth healthy'),
            ('BATCH-2026-001', 'harvested', 'Harvested and sorted'),
            ('BATCH-2026-002', 'planted', 'Transplanted seedlings'),
            ('BATCH-2026-002', 'harvested', 'Crated'),
            ('BATCH-2026-002', 'market_ready', 'Listed on market portal'),
            ('BATCH-2026-003', 'planted', 'Seed potatoes planted')
        """)

    conn.commit()
    conn.close()


# Initialize database when this file loads
init_db()


# ------------------------------------------------------------------------------
# 4. REST API Endpoints
# ------------------------------------------------------------------------------

# --- Endpoint 1: Backend Health Check ---
@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Check backend status, database connection, and dataset file presence.
    """
    db_ok = False
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        db_ok = False

    return jsonify({
        "status": "healthy",
        "service": "Smart Agriculture REST API",
        "version": "1.0.0",
        "database_connected": db_ok,
        "dataset_csv_exists": CROP_DATASET_CSV.exists(),
        "models_dir_exists": MODELS_DIR.exists(),
        "disease_model_loaded": DISEASE_MODEL is not None,
        "disease_model_classes": len(CLASS_LABELS) if CLASS_LABELS else 0
    }), 200


# --- Endpoint 2: Crop Diagnostics (Image Upload + AI Inference) ---
@app.route("/api/diagnose", methods=["POST"])
def diagnose_crop():
    """
    Accepts an uploaded plant leaf photo from phone camera or gallery.
    1. Validates file format, presence, and size.
    2. If the trained MobileNetV2 model is loaded, runs real AI inference.
    3. Returns the predicted disease class, confidence score, and guidance.
    4. If confidence is too low, returns an honest "uncertain" result.
    5. If the model is not loaded, clearly states so — never invents a prediction.
    """
    # Accept image from either 'image' or 'file' form-data field
    file = request.files.get("image") or request.files.get("file")

    if not file:
        return jsonify({
            "success": False,
            "error": "No image file provided. Please upload a photo with key 'image' or 'file'."
        }), 400

    if file.filename == "":
        return jsonify({
            "success": False,
            "error": "Empty filename received. Please select a valid photo."
        }), 400

    # Validate file extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return jsonify({
            "success": False,
            "error": f"Unsupported file format '{ext}'. Allowed extensions are: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}."
        }), 400

    # Read bytes to check file size
    image_bytes = file.read()
    file_size_bytes = len(image_bytes)

    if file_size_bytes == 0:
        return jsonify({
            "success": False,
            "error": "The uploaded image file is empty (0 bytes)."
        }), 400

    if file_size_bytes > MAX_IMAGE_SIZE_BYTES:
        return jsonify({
            "success": False,
            "error": f"Image file is too large ({file_size_bytes / (1024*1024):.1f} MB). Max allowed size is 16 MB."
        }), 400

    # Shared file details dict (used in every response branch below)
    file_details = {
        "filename": file.filename,
        "format": ext.upper(),
        "size_bytes": file_size_bytes,
        "size_kb": round(file_size_bytes / 1024, 2)
    }

    # ------------------------------------------------------------------
    # AI Inference — only runs when the model was successfully loaded
    # ------------------------------------------------------------------
    if DISEASE_MODEL is not None and TF_AVAILABLE:
        try:
            # 1. Decode image bytes → PIL → resize to 224×224 RGB
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            pil_img = pil_img.resize(IMAGE_SIZE, Image.BILINEAR)

            # 2. Convert to float32 numpy array and apply MobileNetV2 preprocessing
            #    (scales pixel values from [0, 255] to [-1, 1])
            img_array = np.array(pil_img, dtype=np.float32)
            img_array = mobilenet_preprocess(img_array)       # shape: (224, 224, 3)
            img_array = np.expand_dims(img_array, axis=0)     # shape: (1, 224, 224, 3)

            # 3. Run inference
            predictions = DISEASE_MODEL.predict(img_array, verbose=0)  # shape: (1, num_classes)
            confidence = float(np.max(predictions[0]))
            class_idx = int(np.argmax(predictions[0]))
            predicted_class = CLASS_LABELS[class_idx]

            # 4. Low-confidence path — honest uncertain result
            if confidence < CONFIDENCE_THRESHOLD:
                return jsonify({
                    "success": True,
                    "model_connected": True,
                    "ai_prediction": None,
                    "predicted_class": None,
                    "confidence": round(confidence, 4),
                    "confidence_pct": f"{confidence * 100:.1f}%",
                    "is_healthy": None,
                    "message": (
                        f"Image received, but the model's confidence is too low "
                        f"({confidence * 100:.1f}%) to make a reliable prediction. "
                        "Ensure the leaf fills the frame and is well-lit."
                    ),
                    "guidance": (
                        "Try retaking the photo with better lighting and a clear, close-up view "
                        "of a single leaf. Avoid shadows, blurry images, or multiple leaves."
                    ),
                    "disclaimer": (
                        "This is an AI-assisted preliminary assessment. "
                        "Always confirm results with a qualified agricultural expert."
                    ),
                    "file_details": file_details,
                    "supported_disease_classes": CLASS_LABELS
                }), 200

            # 5. High-confidence path — return the prediction
            is_healthy = "healthy" in predicted_class.lower()
            readable_class = predicted_class.replace("__", " — ").replace("_", " ")

            if is_healthy:
                guidance = (
                    "The leaf appears healthy based on visual analysis. "
                    "Continue regular watering, fertilisation, and pest-monitoring routines."
                )
            else:
                guidance = (
                    f"Potential issue detected: {readable_class}. "
                    "Inspect nearby plants for similar symptoms. "
                    "Consult a local agricultural extension officer or agronomist "
                    "for treatment options before applying any pesticide or fungicide."
                )

            return jsonify({
                "success": True,
                "model_connected": True,
                "ai_prediction": predicted_class,
                "predicted_class": predicted_class,
                "confidence": round(confidence, 4),
                "confidence_pct": f"{confidence * 100:.1f}%",
                "is_healthy": is_healthy,
                "message": f"AI Prediction: {readable_class} — Confidence: {confidence * 100:.1f}%",
                "guidance": guidance,
                "disclaimer": (
                    "This is an AI-assisted preliminary assessment, not a certified "
                    "agricultural or scientific diagnosis. Model trained on PlantVillage dataset "
                    "(15 classes). Always verify with a qualified expert."
                ),
                "file_details": file_details,
                "supported_disease_classes": CLASS_LABELS
            }), 200

        except Exception as inference_error:
            # Inference failed for an unexpected reason — report honestly
            print(f"[DIAGNOSE] Inference error: {inference_error}")
            return jsonify({
                "success": False,
                "model_connected": True,
                "error": (
                    f"The model is loaded but encountered an error during inference: {str(inference_error)}. "
                    "Please try a different image or restart the backend server."
                )
            }), 500

    # ------------------------------------------------------------------
    # No model loaded — honest status, never invent a prediction
    # ------------------------------------------------------------------
    return jsonify({
        "success": True,
        "model_connected": False,
        "ai_prediction": None,
        "predicted_class": None,
        "confidence": None,
        "is_healthy": None,
        "message": (
            "Image received and validated successfully. "
            "The AI disease prediction model is not yet loaded. "
            "Run `python backend/train_model.py` to train the model, "
            "then restart the Flask server."
        ),
        "guidance": None,
        "file_details": file_details,
        "supported_disease_classes": PLANT_VILLAGE_CLASSES
    }), 200


# --- Endpoint 3: Soil Health Analysis ---
@app.route("/api/soil-analysis", methods=["POST"])
def soil_analysis():
    """
    Accepts soil measurements (Nitrogen, Phosphorus, Potassium, pH).
    Validates numeric ranges and performs standard agronomic categorization.
    Explains that complete soil health analysis requires additional data.
    """
    data = request.get_json(silent=True) or request.form.to_dict()

    if not data:
        return jsonify({
            "success": False,
            "error": "No input data provided. Send a JSON body with nitrogen, phosphorus, potassium, and ph."
        }), 400

    # Required soil fields
    required_fields = ["nitrogen", "phosphorus", "potassium", "ph"]
    parsed_values = {}

    for field in required_fields:
        val = data.get(field)
        if val is None or val == "":
            return jsonify({
                "success": False,
                "error": f"Missing required soil parameter: '{field}'."
            }), 400
        try:
            parsed_values[field] = float(val)
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "error": f"Invalid value for '{field}'. Expected a numeric number."
            }), 400

    n = parsed_values["nitrogen"]
    p = parsed_values["phosphorus"]
    k = parsed_values["potassium"]
    ph = parsed_values["ph"]

    # Agronomic range checks
    if ph < 0 or ph > 14:
        return jsonify({
            "success": False,
            "error": f"Soil pH must be between 0.0 and 14.0 (received: {ph})."
        }), 400

    if n < 0 or p < 0 or k < 0:
        return jsonify({
            "success": False,
            "error": "Nutrient values (N, P, K) cannot be negative."
        }), 400

    # Basic agronomic level classification (Standard soil guideline ranges)
    n_status = "Low" if n < 50 else ("Medium" if n <= 100 else "High")
    p_status = "Low" if p < 30 else ("Medium" if p <= 60 else "High")
    k_status = "Low" if k < 35 else ("Medium" if k <= 70 else "High")

    if ph < 6.0:
        ph_status = "Acidic"
    elif 6.0 <= ph <= 7.5:
        ph_status = "Optimal / Neutral"
    else:
        ph_status = "Alkaline"

    return jsonify({
        "success": True,
        "model_connected": False,
        "input_measurements": {
            "nitrogen": n,
            "phosphorus": p,
            "potassium": k,
            "ph": ph
        },
        "nutrient_assessment": {
            "nitrogen_level": n_status,
            "phosphorus_level": p_status,
            "potassium_level": k_status,
            "ph_level": ph_status
        },
        "message": (
            "Soil measurements validated successfully. "
            "Preliminary NPK and pH levels evaluated against standard soil benchmarks. "
            "Note: Complete soil-health analysis requires additional laboratory/field data "
            "(such as electrical conductivity, organic matter percentage, and micronutrients)."
        )
    }), 200


# --- Endpoint 4: Crop Recommendation ---
@app.route("/api/recommend-crop", methods=["POST"])
def recommend_crop():
    """
    Accepts N, P, K, temperature, humidity, pH, and rainfall.
    Loads datasets/Crop_recommendation.csv using a relative path.
    Does NOT pretend an AI model made a prediction if no model file exists.
    Instead, calculates statistical baseline matches from the dataset.
    """
    data = request.get_json(silent=True) or request.form.to_dict()

    if not data:
        return jsonify({
            "success": False,
            "error": "No input data provided. Send a JSON body with N, P, K, temperature, humidity, ph, and rainfall."
        }), 400

    required_params = {
        "nitrogen": ("N", 0, 300),
        "phosphorus": ("P", 0, 300),
        "potassium": ("K", 0, 300),
        "temperature": ("temperature", -10, 60),
        "humidity": ("humidity", 0, 100),
        "ph": ("ph", 0, 14),
        "rainfall": ("rainfall", 0, 500)
    }

    user_values = {}
    for param, (csv_name, min_v, max_v) in required_params.items():
        # Allow either full name (nitrogen) or CSV short name (N)
        val = data.get(param) if data.get(param) is not None else data.get(csv_name)
        if val is None or val == "":
            return jsonify({
                "success": False,
                "error": f"Missing required parameter '{param}' (or '{csv_name}')."
            }), 400
        try:
            f_val = float(val)
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "error": f"Invalid numeric value for '{param}'."
            }), 400

        if not (min_v <= f_val <= max_v):
            return jsonify({
                "success": False,
                "error": f"Parameter '{param}' value {f_val} is outside valid agronomic range [{min_v}, {max_v}]."
            }), 400

        user_values[csv_name] = f_val

    # Verify dataset existence via project-relative path
    if not CROP_DATASET_CSV.exists():
        return jsonify({
            "success": False,
            "error": f"Dataset file not found at expected relative path: {CROP_DATASET_CSV}"
        }), 500

    # Read dataset and compute crop averages for baseline reference matching
    crop_stats = {}
    with open(CROP_DATASET_CSV, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            crop = row["label"]
            if crop not in crop_stats:
                crop_stats[crop] = {"count": 0, "N": 0.0, "P": 0.0, "K": 0.0, "temperature": 0.0, "humidity": 0.0, "ph": 0.0, "rainfall": 0.0}
            crop_stats[crop]["count"] += 1
            for k in ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]:
                crop_stats[crop][k] += float(row[k])

    # Calculate average values per crop
    crop_averages = []
    for crop, vals in crop_stats.items():
        cnt = vals["count"]
        avg = {k: vals[k] / cnt for k in ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]}
        
        # Calculate normalized Euclidean distance to user input as a statistical reference
        dist_sq = 0.0
        scales = {"N": 100.0, "P": 50.0, "K": 50.0, "temperature": 20.0, "humidity": 50.0, "ph": 4.0, "rainfall": 150.0}
        for k, scale in scales.items():
            dist_sq += ((user_values[k] - avg[k]) / scale) ** 2
        distance = math.sqrt(dist_sq)

        crop_averages.append({
            "crop": crop,
            "distance_score": round(distance, 3),
            "typical_requirements": {k: round(avg[k], 1) for k in avg}
        })

    # Sort crops by statistical similarity
    crop_averages.sort(key=lambda x: x["distance_score"])
    top_reference_matches = crop_averages[:3]

    # Check if a trained ML model exists in models/
    trained_model_exists = any((MODELS_DIR).glob("*.pkl")) or any((MODELS_DIR).glob("*.joblib"))

    return jsonify({
        "success": True,
        "model_connected": trained_model_exists,
        "ai_prediction": None if not trained_model_exists else "MODEL_INFERENCE_READY",
        "notice": (
            "No trained machine learning model was loaded. "
            "These results are computed strictly from statistical baseline matching against Crop_recommendation.csv. "
            "An AI classifier will be trained in the next phase."
        ),
        "user_input": user_values,
        "statistical_reference_matches": top_reference_matches
    }), 200


# --- Endpoint 5: Farm-to-Market Batches (GET & POST) ---
@app.route("/api/market/batches", methods=["GET"])
def get_market_batches():
    """
    Retrieve all crop batches from SQLite database with their latest status and market listing.
    Supports optional filtering by status (e.g., ?status=harvested).
    """
    status_filter = request.args.get("status")

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT 
            b.id,
            b.batch_id,
            b.crop_name,
            b.variety,
            b.planted_date,
            b.harvest_date,
            b.quantity_kg,
            b.farm_location,
            b.status,
            b.notes,
            b.created_at,
            m.price_per_kg,
            m.currency,
            m.listing_status,
            m.contact_phone
        FROM crop_batches b
        LEFT JOIN market_listings m ON b.batch_id = m.batch_id
    """
    params = []
    if status_filter:
        query += " WHERE b.status = ?"
        params.append(status_filter)

    query += " ORDER BY b.id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    batches = []
    for row in rows:
        batches.append({
            "id": row["id"],
            "batch_id": row["batch_id"],
            "crop_name": row["crop_name"],
            "variety": row["variety"],
            "planted_date": row["planted_date"],
            "harvest_date": row["harvest_date"],
            "quantity_kg": row["quantity_kg"],
            "farm_location": row["farm_location"],
            "status": row["status"],
            "notes": row["notes"],
            "created_at": row["created_at"],
            "market_listing": {
                "price_per_kg": row["price_per_kg"],
                "currency": row["currency"] or "INR",
                "listing_status": row["listing_status"],
                "contact_phone": row["contact_phone"]
            } if row["price_per_kg"] is not None else None
        })

    return jsonify({
        "success": True,
        "count": len(batches),
        "batches": batches
    }), 200


@app.route("/api/market/batches", methods=["POST"])
def create_market_batch():
    """
    Register a new harvest batch into the SQLite database.
    """
    data = request.get_json(silent=True) or request.form.to_dict()

    if not data:
        return jsonify({"success": False, "error": "No JSON payload provided."}), 400

    required = ["batch_id", "crop_name", "quantity_kg"]
    for field in required:
        if not data.get(field):
            return jsonify({"success": False, "error": f"Missing required field: '{field}'."}), 400

    try:
        quantity = float(data["quantity_kg"])
        if quantity <= 0:
            return jsonify({"success": False, "error": "Quantity must be greater than zero."}), 400
    except ValueError:
        return jsonify({"success": False, "error": "Quantity must be a valid number."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO crop_batches 
            (batch_id, crop_name, variety, planted_date, harvest_date, quantity_kg, farm_location, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["batch_id"].strip(),
            data["crop_name"].strip(),
            data.get("variety", "").strip(),
            data.get("planted_date"),
            data.get("harvest_date"),
            quantity,
            data.get("farm_location", "").strip(),
            data.get("status", "planted").strip(),
            data.get("notes", "").strip()
        ))

        # Log creation in status history
        cursor.execute("""
            INSERT INTO batch_status_history (batch_id, status, stage_notes)
            VALUES (?, ?, ?)
        """, (data["batch_id"].strip(), data.get("status", "planted").strip(), "Initial batch creation"))

        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"success": False, "error": f"Batch ID '{data['batch_id']}' already exists."}), 409
    finally:
        conn.close()

    return jsonify({
        "success": True,
        "message": f"Batch '{data['batch_id']}' created successfully.",
        "batch_id": data["batch_id"]
    }), 201


# ------------------------------------------------------------------------------
# 5. Application Entry Point
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("🌱 Smart Agriculture Flask Backend Server Running")
    print(f"📁 Database: {DATABASE_PATH}")
    print(f"📊 Dataset:  {CROP_DATASET_CSV}")
    print("🚀 API URL:  http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host="127.0.0.1", port=5000, debug=True)
