# ⚡ Hackathon Intelligence & MVP Strategy Desk

> An enterprise-grade developer workstation that deep-scrapes hackathon briefs, calculates candidate skill alignment via vector profiles, and synthesizes competition-winning MVP pitch decks on demand.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg?logo=react&logoColor=white)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-M0%2FAtlas-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Clerk Auth](https://img.shields.io/badge/Auth-Clerk_JIT-6C47FF.svg?logo=clerk&logoColor=white)](https://clerk.com/)

---

## 📌 Problem & Overview

Navigating competitive hackathons is friction-heavy: listings are fragmented across platforms, crucial details (rules, constraints, prize breakdowns) are buried inside unstructured pages or ambiguous documents, and ideating feasible MVPs under strict timelines often wastes valuable competition hours.

**Hackathon Scrapper** bridges this workflow by delivering:
1. **Automated & On-Demand JIT Scraping**: Live extraction of hackathon briefs, reward pools, team size limits, and submission timelines.
2. **Vector Profile Matchmaking & Gap Analysis**: Algorithmic scoring that compares candidate resumes and skill profiles against hackathon problem requirements.
3. **AI MVP Pitch Synthesis Engine**: An intelligent architectural workstation that analyzes scraped competition context and generates complete technical blueprints, recommended stacks, and judging demo strategies using Google Gemini.

---

## ✨ Key Features

- **⚡ Just-In-Time (JIT) Enrichment Pipeline**: Automatically performs deep hydration via Cheerio when an unindexed hackathon listing is opened, persisting parsed fields directly into MongoDB.
- **🧠 Generative MVP Pitch Synthesis**: Produces structured project briefs including:
  - Validated Problem Statement & Solution Overview
  - Granular Key Technical Features
  - Production Tech Stack & Architectural Microservices
  - Ideal Teammate Role Recommendations
  - Step-by-Step Live Judging Demo Strategy
- **🎯 Algorithmic Skill Alignment**: Evaluates direct candidate skill intersections and highlights stack deficiencies before registration.
- **🖥️ ERP Terminal Interface**: A high-density dark mode developer aesthetic built with Tailwind CSS and Zustand for zero-latency state synchronization.
- **🔒 Enterprise Auth & Profile Ingestion**: Secure Clerk authentication, Svix-verified webhook user syncing, JIT user provisioning, and Multer-powered PDF resume uploads.

---

## 🏛️ System Architecture

```text
                                [ Client / React (Vite) ]
                                            │
                                            │ HTTPS / Clerk Bearer Token
                                            ▼
                           [ Node.js + Express API Gateway ]
                                  │                 │
                 Mongoose ODM /   │                 │ Internal HTTP / JSON
                 JIT Enrichment   │                 │ (Service Mesh)
                                  ▼                 ▼
                         [ MongoDB Atlas ]   [ Python FastAPI Microservice ]
                                                    │
                                                    │ Google GenAI SDK
                                                    ▼
                                           [ Google Gemini API ]
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand, Lucide React, React Hot Toast |
| **API Gateway** | Node.js, Express.js, Mongoose, Cheerio, Axios, Multer |
| **AI Microservice** | Python 3.10+, FastAPI, Uvicorn, Google GenAI SDK, Pydantic |
| **Authentication** | Clerk (JWT Verification, Svix Webhook Signatures, JIT User Provisioning) |
| **Database** | MongoDB Atlas (Vector Search & Document Store) |

---

## 📂 Project Structure

```text
Hackathon-Scrapper/
├── backend/
│   ├── src/
│   │   ├── config/             # DB & Cloud configurations
│   │   ├── controllers/        # Express route controllers
│   │   ├── middlewares/        # Clerk auth & Multer handlers
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # REST API endpoints
│   │   ├── services/           # Cheerio scraping & microservice clients
│   │   └── server.js           # Server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # Dossier, cards, & UI components
│   │   ├── pages/              # Directory & HackathonDetailPage
│   │   ├── store/              # Zustand state stores
│   │   ├── lib/                # Axios API client
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── ai-service/
│   ├── main.py                 # FastAPI synthesis & Gemini endpoints
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Python** (v3.10 or higher)
- **MongoDB Atlas** account (or local MongoDB daemon)
- **Clerk** account for user authentication
- **Google AI Studio** Gemini API Key

---

### 1. Clone the Repository
```bash
git clone https://github.com/kiu-art/Hackathon-Scrapper.git
cd Hackathon-Scrapper
```

---

### 2. Configure Environment Variables

#### Backend (`backend/.env`)
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hackathon_db?retryWrites=true&w=majority
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
AI_SERVICE_URL=http://localhost:8000
```

#### Frontend (`frontend/.env`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:3000/api
```

#### AI Microservice (`ai-service/.env`)
```env
GEMINI_API_KEY=AIzaSy...
PORT=8000
```

---

### 3. Run the Python AI Microservice

```bash
cd ai-service
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

### 4. Run the Express Backend

```bash
cd ../backend
npm install
npm run dev
```

---

### 5. Run the React Frontend

```bash
cd ../frontend
npm install
npm run dev
```

The application will be live at `http://localhost:5173`.

---

## 🔌 API Endpoints Summary

### Hackathons
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/hackathons` | Fetch indexed hackathon list |
| `GET` | `/api/hackathons/matches` | Get vector-ranked hackathons for authenticated candidate |
| `GET` | `/api/hackathons/:id` | Get full technical dossier (auto-scrapes if shallow) |
| `POST` | `/api/hackathons/:id/pitch` | Generate Gemini MVP architecture & pitch deck |

### Candidate Profile
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Retrieve candidate profile, skills, and embeddings |
| `PUT` | `/api/users/profile` | Update profile and upload resume (`multipart/form-data`) |
| `POST` | `/api/webhooks/clerk` | Clerk webhook sync (Svix signature verified) |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.