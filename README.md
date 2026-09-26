# 🚛 LoadConnect (YOKI) — Peer-to-Peer Freight Logistics Platform

> **"Airbnb / BlaBlaCar for Cargo & Freight Space"**  
> A full-stack logistics marketplace connecting commercial freight drivers with spare vehicle capacity to merchants who need to transport small-to-medium cargo loads without paying for a full dedicated truckload or high freight broker margins.

---

## 🌟 Core Features

- **Fractional Space Reservations:** Modular cargo capacity booking (pallets/units). Real-time atomic deduction prevents overbooking.
- **Closed-Loop Real-Time Chat:** Spam-free coordination via Socket.IO that unlocks strictly once a booking request is accepted by the driver.
- **Interactive Road Mapping (Leaflet & OpenRouteService):** Automatic geocoding and real highway turn-by-turn routing with exact road distance (km) and driving duration (e.g. *Kottayam ➔ Kanjirappally*).
- **Dual-Sided Verified Reputation:** Ratings (1–5 stars) and reviews unlock post-delivery, ensuring trust scores are verified by actual shipments.
- **Modern Responsive Dashboard:** Sleek 3-column LoadSwift-inspired interface with a collapsible sidebar and edge-to-edge layout.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Leaflet.js, Lucide Icons |
| **Backend** | Node.js (ES Modules), Express, better-sqlite3 (WAL mode) |
| **Real-Time** | Socket.IO with room-based chat channels |
| **Routing / GIS** | OpenRouteService API with OSRM fallback |
| **Auth & Security** | JWT Bearer token authentication, bcrypt password hashing |

---

## 📁 Project Structure

```
LoadConnect/
├── Backend/                 # Express & SQLite REST + WebSocket server
│   ├── db/                  # Database initialization, schema & yoki.db
│   ├── middleware/          # JWT authentication and role authorization
│   ├── routes/              # Auth, trips, bookings, messages, reviews
│   ├── socket/              # Real-time chat handler
│   ├── cli.js               # Interactive terminal testing tool
│   ├── server.js            # Server entry point (Port 5000)
│   ├── test_api.js          # 10-step automated E2E smoke tests
│   └── package.json
│
├── Frontend/                # React + Vite application
│   ├── src/
│   │   ├── components/      # Common UI components (RouteMap, CapacityMeter, etc.)
│   │   ├── context/         # AuthContext & session management
│   │   ├── pages/           # Auth, DriverDashboard, TripSearch, Bookings
│   │   └── services/        # API client, routing engine & socket service
│   ├── index.html
│   ├── vite.config.js       # Vite configuration (binds to 0.0.0.0:5173)
│   ├── .env.example         # Frontend environment template
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Environment Setup

Copy example environment files:
```bash
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
```

### 2. Start the Backend Server

```bash
cd Backend
npm install
npm run dev
```

* The API server runs at: **`http://localhost:5000`**
* Health check endpoint: **`http://localhost:5000/api/health`**

### 2. Start the Frontend Application

```bash
cd Frontend
npm run dev
```

* The frontend application runs at: **`http://localhost:5173`**

---

## 🧪 Demo Credentials & Testing

On the `/auth` page, click the **Sparkle (✨) button** or Apple/Google social icons for 1-click credential auto-fill:

- **Demo Driver:** `demo_driver@yoki.test` / `password123`
- **Demo Merchant:** `demo_merchant@yoki.test` / `password123`

You can also use the **"Switch to Merchant / Driver"** button in the sidebar to test both roles simultaneously.

---

## 🔬 Automated Testing & CLI

- Run the automated 10-step integration test:
  ```bash
  cd Backend
  node test_api.js
  ```
- Launch the interactive terminal CLI console:
  ```bash
  cd Backend
  npm run cli
  ```
