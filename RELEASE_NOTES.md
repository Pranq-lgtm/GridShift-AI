# GridShift-AI Release Notes

---

# GridShift-AI v1.1.0

**Release date:** October 23, 2026

GridShift-AI v1.1.0 introduces **Google Maps Platform Live Grid visualization** centered on the Madgaon (Margao) municipal area, an end-to-end **Automated Citizen Ticket Redressal & Closed-Loop Feedback System**, **email-bound Admin/Citizen Role-Based Access Control (RBAC)** with a streamlined Login & Forgot Password flow, **15.1x vectorized bulk permit ingestion**, and **Gemini 2.5 Flash rate-limit resilience**.

## Highlights

- **Google Maps Platform Live Grid Map (Madgaon Default View)**:
  - Integrated `@vis.gl/react-google-maps` (`APIProvider`, `Map`, and `AdvancedMarker`) with the default viewport locked to the **Madgaon, Goa** local area (`15.2736° N, 73.9575° E`, zoom `14`).
  - Interactive color-coded pointers for **Construction & Demolition (C&D) Debris sites** (`CD-101` to `CD-105`), **Micro-Surge Hotspots** (`SG-201`, `SG-202`), **Geotagged Citizen Redressal Tickets** (`TKT-*`), and **3D Hex Density** zones.
- **Automated Citizen Ticket Redressal & Closed-Loop Feedback System (`/redressal`)**:
  - 6-stage automated ticket tracking pipeline: `OPEN` → `TRIAGED` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `VERIFIED_CLOSED`.
  - Severity-based SLA targets (`Critical`: 4h, `High`: 12h, `Medium`: 24h, `Low`: 48h), automated ward geotagging, and municipal fleet assignment (`Compactor T-402`, `Rover R-1`, `Rover R-3`, `Tipper T-304`).
  - Closed-loop citizen verification: citizens rate resolved tickets (`1–5 stars`) to verify cleanup (`VERIFIED_CLOSED`) or flag incomplete work to automatically reopen the ticket back to `IN_PROGRESS`.
- **Streamlined Authentication & Email-Bound RBAC (`/login` & `/redressal`)**:
  - Redesigned the Login page to remove RBAC role-selection jargon and added a **Forgot Password (`sendPasswordResetEmail`)** recovery workflow alongside Firebase Email/Password and Mobile OTP (`+91`).
  - Removed manual Admin/Citizen view toggles across the application. Authenticating with **`pranavkantak9@gmail.com`** automatically unlocks the **Platform Admin Dispatch & Audit Console**, while authenticating with any other email automatically renders the **Citizen Reporter View**.
  - Restricted the **GitHub Repository Audit (`Pranq-lgtm/GridShift-AI`)** and bulk ingestion benchmark panel exclusively to the Platform Admin (`pranavkantak9@gmail.com`).
- **Core Logic Performance Optimizations (15.1x Faster Bulk Ingestion)**:
  - **Vectorized Bulk Permit Ingestion (`backend/server.js` & `ml_service/main.py`)**: Replaced sequential per-permit HTTP prediction and database writes in `POST /api/permits/bulk` with vectorized batch inference (`POST /predict/batch`) and single-roundtrip `Permit.insertMany({ ordered: false })`, cutting 25-permit ingestion latency from `~2840ms` to `~188ms` (**15.1x speedup**).
  - **Client-Side Image Compression (`WasteCameraModal.jsx`)**: Added HTML5 Canvas thumbnail compression (`≤ 480px`, JPEG `0.72`) for citizen incident photos to prevent browser `localStorage` 5MB quota exhaustion.
- **Gemini Free-Tier Upgrade & Rate-Limit Resilience (`gemini-2.5-flash`)**:
  - Upgraded the AI Copilot engine (`ml_service/main.py` & `frontend/src/utils/ragEngine.js`) to the latest free-tier **`gemini-2.5-flash`** model with automatic fallback to **`gemini-2.5-flash-lite`**.
  - Added a client/server sliding-window rate limiter (`12 requests/min` guard), HTTP `429 RESOURCE_EXHAUSTED` exponential backoff with jitter + `Retry-After` header support, and a 5-minute TTL response cache.

## Architecture & API Additions

- **Frontend (`frontend/`)**:
  - Added `@vis.gl/react-google-maps` for Madgaon geospatial visualization in `src/pages/Dashboard.jsx`.
  - Added `src/pages/Redressal.jsx` for email-bound Admin dispatch & Citizen feedback tracking.
  - Updated `src/Login.jsx`, `src/Navbar.jsx`, `src/App.jsx`, `src/firebase.js`, and `src/utils/ragEngine.js`.
- **Backend (`backend/server.js`)**:
  - Vectorized `POST /api/permits/bulk` with batch ML calls and `insertMany`.
  - Added REST endpoints for citizen redressal tickets: `GET /api/tickets`, `POST /api/tickets`, `PATCH /api/tickets/:id/status` (Admin RBAC enforced for `pranavkantak9@gmail.com`), and `POST /api/tickets/:id/feedback`.
- **ML Service (`ml_service/main.py`)**:
  - Added `POST /predict/batch` for vectorized multi-event XGBoost inference.
  - Added sliding-window rate limiting, TTL caching, and exponential backoff for `gemini-2.5-flash`.

---

# GridShift-AI v0.1

**Release date:** October 23, 2026

GridShift-AI v0.1 is the initial release of the waste-surge forecasting platform for municipal sanitation teams. It combines civic event data, machine-learning predictions, and an AI copilot to help fleet managers plan collection resources before localized waste pressure becomes an overflow.

## Highlights

- **Predictive waste-pressure map** with 3D geospatial visualization of forecasted neighborhood surges.
- **Municipal permit ingestion** for construction activity, public gatherings, street fairs, and food festivals.
- **XGBoost forecasting service** that estimates event-related waste tonnage and assigns a pressure level.
- **AI Waste Surge Copilot** powered by Google Gemini, providing explanations, timing, recommendations, and confidence for each forecast.
- **Fleet operations dashboard** with dashboard, fleet, and analytics views.
- **Waste reporting camera flow** for submitting on-the-ground waste observations.
- **Google authentication** through Firebase, with demo-user support for local exploration.
- **REST services** for health checks, permit retrieval, bulk permit ingestion, and forecast integration.
- **Newsletter/waitlist subscription endpoint** with Mailchimp integration support.

## Architecture

This release includes:

- React and Vite frontend
- Node.js and Express backend
- FastAPI and XGBoost machine-learning service
- MongoDB persistence through Mongoose
- Firebase authentication
- Mapbox and Deck.gl geospatial visualization

## Getting started

See the [README](README.md) for prerequisites, environment variables, local startup instructions, sample payloads, and deployment guidance.

## Known limitations

- Forecast quality depends on the available training and event data.
- External services require local configuration, including MongoDB, Firebase, Mapbox, and Gemini credentials.
- The municipal data scraper currently uses synthetic permit data for demonstration.
- Production deployments must configure secrets independently in their hosting environments.
