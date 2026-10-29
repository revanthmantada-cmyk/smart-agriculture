# 🌱 Smart Agriculture Backend REST API

This is the backend service for the **Smart Agriculture Hackathon Project**, built with **Python Flask** and **SQLite**.

It exposes modular REST API endpoints for:
1. **Crop Diagnostics** (Plant leaf photo validation & disease detection gateway)
2. **Soil Health Analysis** (Soil NPK & pH validation and nutrient classification)
3. **Crop Recommendation** (Agro-climatic suitability lookup loaded from `datasets/Crop_recommendation.csv`)
4. **Farm-to-Market Tracking** (Produce batch logging, stage tracking, and market listings)

---

## 📂 Project Structure

```
SMART AGRICULTURE/
├── backend/
│   ├── app.py                   # Flask server with all REST endpoints
│   ├── smart_agriculture.db     # SQLite database for crop batches & market listings
│   ├── requirements.txt         # Python dependencies
│   └── README.md                # Documentation and running guide
├── datasets/
│   ├── Crop_recommendation.csv  # 2,200 agro-climatic soil & crop samples
│   ├── PlantVillage/            # Extracted leaf disease images (15 classes)
│   └── ...                      # Reference research notebooks
├── frontend/                    # React web application (Step 3)
└── models/                      # Trained AI models (Step 4)
```

---

## 🛠️ Prerequisites & Installation

### Step 1: Open a Terminal / Command Prompt
Navigate into the `backend` folder:
```bash
cd "C:\Users\REVANTH\Downloads\SMART AGRICULTURE\backend"
```

### Step 2: Install Python Dependencies
Run:
```bash
pip install -r requirements.txt
```
*(If you have multiple Python versions installed, use `py -m pip install -r requirements.txt` or `python -m pip install -r requirements.txt`)*

---

## 🚀 Running the Flask Server

Start the backend server on localhost:
```bash
python app.py
```

The server will initialize the SQLite database automatically and listen on:
```
http://127.0.0.1:5000
```

---

## 📡 REST API Endpoints Reference

### 1. Health Check
* **Endpoint:** `GET /api/health`
* **Description:** Verifies server status, database connection, and dataset file availability.
* **Example Response:**
  ```json
  {
    "status": "healthy",
    "service": "Smart Agriculture REST API",
    "version": "1.0.0",
    "database_connected": true,
    "dataset_csv_exists": true,
    "models_dir_exists": true
  }
  ```

---

### 2. Crop Diagnostics (Image Upload)
* **Endpoint:** `POST /api/diagnose`
* **Description:** Accepts plant leaf photos from camera or gallery (`multipart/form-data` with key `image` or `file`).
* **Validation:** Validates file existence, supported extensions (`.jpg`, `.jpeg`, `.png`, `.webp`), and size limit (16MB).
* **AI Status:** Honestly returns validation status without inventing fake predictions until a trained vision model is linked in later steps.
* **Example Response:**
  ```json
  {
    "success": true,
    "model_connected": false,
    "ai_prediction": null,
    "message": "Image received and validated successfully. AI disease prediction model is not yet connected.",
    "file_details": {
      "filename": "tomato_leaf.jpg",
      "format": "JPG",
      "size_kb": 245.5
    },
    "supported_disease_classes": [
      "Tomato_Early_blight",
      "Tomato_Late_blight",
      "Tomato_healthy",
      "..."
    ]
  }
  ```

---

### 3. Soil Health Analysis
* **Endpoint:** `POST /api/soil-analysis`
* **Description:** Accepts soil measurement metrics in JSON or form body.
* **Payload:**
  ```json
  {
    "nitrogen": 85,
    "phosphorus": 45,
    "potassium": 50,
    "ph": 6.8
  }
  ```
* **Validation:** Checks numeric validity and agronomic ranges.
* **Example Response:**
  ```json
  {
    "success": true,
    "model_connected": false,
    "nutrient_assessment": {
      "nitrogen_level": "Medium",
      "phosphorus_level": "Medium",
      "potassium_level": "Medium",
      "ph_level": "Optimal / Neutral"
    },
    "message": "Soil measurements validated successfully. Preliminary NPK and pH levels evaluated against standard soil benchmarks. Note: Complete soil-health analysis requires additional laboratory/field data (such as electrical conductivity, organic matter percentage, and micronutrients)."
  }
  ```

---

### 4. Crop Recommendation
* **Endpoint:** `POST /api/recommend-crop`
* **Description:** Evaluates 7 agro-climatic parameters against `datasets/Crop_recommendation.csv` using a relative path.
* **Payload:**
  ```json
  {
    "nitrogen": 90,
    "phosphorus": 42,
    "potassium": 43,
    "temperature": 21.0,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.9
  }
  ```
* **AI Status:** Transparently states no trained ML model is connected yet, providing mathematical nearest-neighbor baseline matches from the dataset instead of pretending to have an AI model.
* **Example Response:**
  ```json
  {
    "success": true,
    "model_connected": false,
    "ai_prediction": null,
    "notice": "No trained machine learning model was loaded. These results are computed strictly from statistical baseline matching against Crop_recommendation.csv.",
    "statistical_reference_matches": [
      {
        "crop": "rice",
        "distance_score": 0.082,
        "typical_requirements": {
          "N": 79.9, "P": 47.6, "K": 39.9,
          "temperature": 23.7, "humidity": 82.3,
          "ph": 6.4, "rainfall": 236.2
        }
      }
    ]
  }
  ```

---

### 5. Farm-to-Market Tracking
* **Endpoint:** `GET /api/market/batches`
* **Description:** Fetches all harvest batches with their current stage status and market price listings.
* **Optional Query:** `?status=harvested`
* **Example Response:**
  ```json
  {
    "success": true,
    "count": 3,
    "batches": [
      {
        "batch_id": "BATCH-2026-001",
        "crop_name": "Tomato",
        "variety": "Roma Hybrid",
        "quantity_kg": 450.0,
        "status": "harvested",
        "market_listing": {
          "price_per_kg": 32.5,
          "currency": "INR",
          "listing_status": "active"
        }
      }
    ]
  }
  ```

* **Endpoint:** `POST /api/market/batches`
* **Description:** Adds a new produce batch to the database.
* **Payload:**
  ```json
  {
    "batch_id": "BATCH-2026-004",
    "crop_name": "Potato",
    "variety": "Kufri",
    "quantity_kg": 500,
    "farm_location": "Field 3",
    "status": "planted"
  }
  ```

---

## 🗄️ SQLite Database Schema

The database file is created at `backend/smart_agriculture.db` with 3 linked tables:

1. **`crop_batches`**: Primary batch details (id, batch_id, crop_name, variety, planted_date, harvest_date, quantity_kg, farm_location, status, notes).
2. **`market_listings`**: Marketplace prices, quantities, and contact info linked to batch_id.
3. **`batch_status_history`**: Audit trail tracking status transitions (`planted` -> `growing` -> `harvested` -> `market_ready` -> `sold`).
