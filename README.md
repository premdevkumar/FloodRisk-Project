
# 🌊 Flood Risk & Rescue Management System

An AI-powered, real-time Flood Risk & Rescue Management System built with React 18, TypeScript, Leaflet.js, Spring Boot 3, Java 25, and Python FastAPI (PyTorch LSTM).

---

## 🚀 How to Run the Full Stack Application

### 1️⃣ Frontend (React 18 + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
# App runs at: http://localhost:5173
```

### 2️⃣ Backend Microservice (Spring Boot + Java 25 + H2)
```bash
cd backend
mvn spring-boot:run
# REST API runs at: http://localhost:8080
# H2 Console available at: http://localhost:8080/h2-console
```

### 3️⃣ Machine Learning Worker (Python FastAPI + PyTorch)
```bash
cd ml
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
py api.py
# ML REST API runs at: http://localhost:8001
# Interactive Swagger docs: http://localhost:8001/docs
```

---

## 🔑 Demo Login Credentials

- **Admin SuperUser Account** (auto-seeded by `AdminSeeder.java`):
  - **Username**: `premdevkumar`
  - **Password**: `Admin@12345`
  - **Role**: `ADMIN` (Access to all user registries, official triage, farmer advisor & live map)

- **Resident Account**: Register a new account with role `RESIDENT` or use demo login.
- **Farmer Account**: Register with role `FARMER`.
- **Official Account**: Register with role `OFFICIAL`.

---

## 🏗️ Technical Architecture Highlights

- **React-Leaflet + OSRM**: Interactive map displaying color-coded CWC flood monitoring stations with automatic danger-zone detour waypoint injection and Google-Maps style turn-by-turn directions drawer.
- **Geofenced Push Alerts**: Haversine formula calculation for physical proximity alerts and native browser notifications.
- **Spring Boot JPA & Security**: JWT stateless authentication, BCrypt password hashing, Regex password enforcement, and `CommandLineRunner` master account seeder.
- **CWC Flood Data Web Scraper**: Jsoup parser running on `@Scheduled` intervals with thread-safe `CopyOnWriteArrayList` memory caching.
- **PyTorch LSTM Time-Series Predictor & Multi-Lingual NLP**: Neural network flood prediction and Deep-Translator advisory report generation for Telugu, Hindi, Marathi, Tamil, and English.


