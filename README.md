# 🛡️ VANGUARD — The Verified Impact Pipeline

> *Bridging rural community needs and NGO resources through video-verified reporting, decentralized consensus, and algorithmic volunteer matching.*

---

## What Is Vanguard?

NGOs operating in rural India face two compounding crises: **scattered, paper-based data** and **high volunteer churn** caused by poor task allocation. Volunteers burn out on missions they're unqualified for. Communities wait days for help that never comes.

Vanguard solves this with a high-trust geospatial operations platform:

- **Villagers** report problems with GPS location, urgency, and photo evidence
- **The algorithm** scores every available volunteer and dispatches the top 5 in seconds
- **Volunteers** accept missions, upload proof, and confirm resolution
- **5 independent confirmations** auto-close a mission — decentralized, tamper-resistant consensus
- **NGO commanders** monitor everything from a live map dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TailwindCSS, React-Leaflet |
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Database | PostgreSQL 15 + PostGIS (geospatial queries) |
| Auth | Firebase Auth (OTP) — demo uses hardcoded `123456` |
| State | Zustand (frontend) |
| HTTP | Axios |

---

## Project Structure

```
vanguard/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── MetricCard.jsx      # Animated stat counters
│       │   │   ├── ReportFeed.jsx      # Urgency-sorted incident feed
│       │   │   └── DispatchModal.jsx   # Dispatch engine UI + results
│       │   ├── map/
│       │   │   ├── ProblemMarker.jsx   # Custom SVG urgency pins
│       │   │   └── MapLegend.jsx       # Map overlay legend
│       │   └── shared/
│       │       ├── Navbar.jsx          # Role-aware navigation
│       │       └── ProtectedRoute.jsx  # Route auth guard
│       ├── pages/
│       │   ├── Login.jsx               # OTP auth flow
│       │   ├── Dashboard.jsx           # NGO command center
│       │   ├── ReportProblem.jsx       # Villager report form
│       │   └── VolunteerView.jsx       # Volunteer dispatch queue
│       ├── hooks/
│       │   └── useProblems.js          # Data fetching + demo fallback
│       ├── services/
│       │   ├── api.js                  # Axios → FastAPI
│       │   └── firebase.js             # OTP auth (demo + real stubs)
│       └── store/
│           └── authStore.js            # Zustand session store
│
└── backend/
    └── app/
        ├── models/         # SQLAlchemy ORM + PostGIS geography columns
        ├── schemas/        # Pydantic request/response contracts
        ├── services/
        │   └── matching_engine.py   # The Vanguard Score algorithm
        └── api/routes/
            ├── problems.py          # CRUD for incident reports
            └── match.py             # Dispatch + consensus endpoints
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15 with PostGIS extension

### 1 — Clone & Enter

```bash
git clone <your-repo-url>
cd vanguard
```

### 2 — Database Setup

```bash
# Create DB and enable PostGIS
psql -U postgres -c "CREATE DATABASE vanguard_db;"
psql -U postgres -d vanguard_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 3 — Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, SECRET_KEY, FIREBASE_PROJECT_ID

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API auto-creates tables on first startup. Seed demo data:

```bash
python seed.py
```

### 4 — Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set VITE_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
```

Open **http://localhost:5173** — the app loads instantly with demo data even without the backend.

---

## Demo Login

The app works fully offline in demo mode. Use any phone number and OTP **`123456`**.

| Role | Access | Demo redirect |
|---|---|---|
| **NGO / Admin** | Command Center map | `/dashboard` |
| **Volunteer** | Dispatch queue, accept/confirm missions | `/volunteer` |
| **Villager** | Report problems with GPS | `/report` |

---

## The Vanguard Algorithm

When a problem is filed, the matching engine scores every available volunteer:

```
Score = (W1 × Skill_Match) + (W2 × (10 / (Distance_km + 1))) + (W3 × Urgency / 10)
```

| Component | Weight | Description |
|---|---|---|
| `Skill_Match` | **W1 = 50** | 1.0 if volunteer has required skill, else 0 |
| `Distance` | **W2 = 30** | Inverse distance — closer = higher score |
| `Urgency` | **W3 = 20** | Normalized urgency as tiebreaker |

**Worked Example** — Medical emergency (urgency 9) vs volunteer 24km away with `medical` skill:

```
Skill     = 50 × 1.0          = 50.00
Distance  = 30 × (10 / 25.0)  = 12.00
Urgency   = 20 × (9 / 10)     = 18.00
                               ───────
Vanguard Score                 = 80.00  ← #1 ranked
```

All score components are stored in the `matches` table for full audit trail and demo explainability.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/problems/` | File a new incident report |
| `GET` | `/api/problems/` | List problems (filterable by status) |
| `POST` | `/api/match/dispatch` | Run algorithm, dispatch top 5 volunteers |
| `GET` | `/api/match/{problem_id}` | Get dispatch records for a problem |
| `POST` | `/api/match/confirm` | Volunteer confirms resolution + uploads proof |

Interactive docs available at **http://localhost:8000/docs** (Swagger UI).

---

## Decentralized Consensus

Vanguard resolves missions without a central authority:

1. A volunteer marks a mission complete and uploads an "after" photo
2. Their `Match` record status changes to `confirmed`
3. `Problem.confirmation_count` increments
4. When **5 independent volunteers** confirm → the problem auto-closes as `resolved`
5. No single volunteer or NGO admin can fake a resolution

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/vanguard_db
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

---

## Common Issues & Fixes

### Blank screen on `/dashboard`

The most common cause is Leaflet's icon path breaking in Vite. Ensure `main.jsx` has:

```js
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl: iconShadow, ... })
```

And **do not use `React.StrictMode`** — it causes Leaflet to double-mount and render blank.

### Map tiles not loading

Check browser console for mixed-content errors. The OSM tile URL must be `https://`.

### PostGIS `ST_Distance` returns wrong units

This project uses `GEOGRAPHY(POINT, 4326)` — not `GEOMETRY`. Geography columns return distances in **meters** automatically. Divide by 1000 for km.

### CORS errors from frontend

Ensure `VITE_API_BASE_URL` in `.env` matches exactly where Uvicorn is running, and that FastAPI's `CORSMiddleware` lists `http://localhost:5173`.

---

## Hackathon Judges — Demo Script

1. Open **http://localhost:5173**
2. Login as **NGO** with any phone + OTP `123456`
3. See the live map with 6 color-coded incidents across Rajasthan
4. Click the **red pin** near Alwar (snakebite, urgency 10)
5. Click **⚡ DISPATCH** — watch the algorithm rank volunteers with score breakdown
6. Logout → Login as **Villager**
7. Allow GPS (or use demo location) → fill report form → submit
8. Watch it auto-dispatch and redirect
9. Logout → Login as **Volunteer**
10. Accept a mission → click "Mark Resolved" → upload photo → confirm
11. Show `confirmation_count` progressing toward 5

Total demo time: **~4 minutes**

---

## Roadmap (Post-MVP)

- [ ] Real Firebase OTP (swap one function in `firebase.js`)
- [ ] Firebase Storage for media uploads
- [ ] Push notifications to volunteers on dispatch
- [ ] Volunteer skill verification via video call
- [ ] Heat map layer showing chronic problem zones
- [ ] Offline-first PWA for low-connectivity rural areas
- [ ] WhatsApp Bot integration for non-smartphone villagers

---

## Team

Built at **[Pivot Lab]** — April 2026

*"The last mile is not a logistics problem. It's a trust problem."*
#   V a n G a u r d  
 