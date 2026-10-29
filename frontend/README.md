# 🌿 AgriSmart Frontend Application

Modern, mobile-friendly Smart Agriculture Dashboard built for desktop computers and Android phones with:
- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Lucide React Icons**
- **Recharts**

---

## 📱 Features

1. **Dashboard:** Live SQLite batch volume chart, system status indicator, quick navigation.
2. **Module 1 — Crop Diagnostics:** Direct mobile camera capture (`capture="environment"`) & gallery photo upload, format validation, size limit checks, honest AI connection reporting.
3. **Module 2 — Soil Health:** NPK nutrient and pH evaluation, preliminary vs laboratory test disclosure, and 7-parameter crop recommendation based on `Crop_recommendation.csv`.
4. **Module 3 — Farm-to-Market Tracking:** Produce batches retrieved directly from SQLite, status chips, search bar, and "+ Register New Batch" modal.

---

## 💻 Exact Windows Commands to Run

### 1. Install Dependencies
Open PowerShell or Command Prompt, navigate to the `frontend` directory, and run:

```powershell
cd "C:\Users\REVANTH\Downloads\SMART AGRICULTURE\frontend"
npm install
```

### 2. Start the Development Server
```powershell
npm run dev
```

The frontend will start and display:
```
  VITE v5.4.10  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

* Open **`http://localhost:5173`** on your desktop browser.
* Open the **`Network`** URL on your Android phone (while connected to the same Wi-Fi) to test camera capture and mobile layout!

### 3. Build for Production
To create an optimized production build:
```powershell
npm run build
```

---

## 🔗 Backend Connection
The frontend connects to the Flask backend running at `http://127.0.0.1:5000`.
In development, the Vite proxy in `vite.config.ts` automatically forwards `/api` requests to Flask to prevent CORS issues.
