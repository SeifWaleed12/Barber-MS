<div align="center">
  <img src="frontned/public/logo.jpg" alt="BarberOS Logo" width="200"/>
  <h1>BarberOS 💈✂️</h1>
  <p><strong>A modern, full-stack barbershop management system designed for scale.</strong></p>

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-18181A?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" /></a>
  </p>
</div>

---

## 📖 Overview

**BarberOS** is a comprehensive, end-to-end management solution tailored specifically for modern barbershops. It moves away from scattered spreadsheets and paper records, providing a centralized dashboard to track everything from daily haircuts and employee salaries to overarching financial reports. 

This project was built with a heavy emphasis on **UI/UX design principles** (Clarity, Consistency, Proximity) using a custom Tailwind CSS design system, backed by a lightning-fast, asynchronous Python backend.

## ✨ Core Features

*   **📊 Real-Time Financial Dashboards:** Track "Money Today" versus "Money This Month" with dynamic Recharts visualizations comparing performance against previous periods.
*   **👥 Employee Management:** Maintain a secure roster of barbers, complete with automated bi-weekly salary tracking.
*   **💵 Session Recording:** Instantly log haircuts, assigning specific services and calculating total revenue based on real-time service pricing.
*   **📉 Dynamic Discount System:** Apply custom percentage or fixed-amount discounts directly at the checkout/session creation step.
*   **🧾 Cost Tracking:** A dedicated module for tracking shop expenses (both fixed and variable), automatically factoring them into the monthly profit calculation.
*   **🔐 Secure JWT Authentication:** Robust, case-insensitive login system utilizing `bcrypt` password hashing and secure token generation to protect business data.

## 🛠️ Technology Stack

### Frontend Architecture
The client side is a Single Page Application (SPA) driven by React and Vite to ensure optimal load times and developer experience.
*   **Framework:** React 19 + Vite
*   **Routing:** React Router DOM (v7)
*   **State Management:** Zustand (for lightweight, scalable auth & data stores)
*   **Styling:** Tailwind CSS (with custom design tokens, glassmorphism, and structured CSS variables)
*   **Icons & Charts:** Lucide React & Recharts
*   **API Interception:** Axios instances configured for automatic JWT bearer injection.

### Backend Architecture
The server side is a RESTful API built for concurrency and strictly typed validation.
*   **Framework:** FastAPI (Python)
*   **Database ORM:** SQLAlchemy (Async)
*   **Database Provider:** Supabase (PostgreSQL)
*   **Migrations:** Alembic
*   **Data Validation:** Pydantic
*   **Security:** Passlib (Bcrypt) + python-jose (JWT)

## 📂 Project Structure

```text
Barber-MS/
├── backend/                      # Python Server Environment
│   ├── alembic/                  # Alembic DB Migration environment
│   ├── app/
│   │   ├── api/v1/routes/        # FastAPI endpoints (auth, sessions, reports, etc.)
│   │   ├── core/                 # Config, Database connections, Security logic
│   │   ├── crud/                 # Database manipulation layer
│   │   ├── models/               # SQLAlchemy PostgreSQL models
│   │   └── schemas/              # Pydantic schemas for I/O validation
│   └── text/                     # Pytest suite
│
└── frontned/                     # React Client Environment
    ├── public/                   # Static assets (Logos, Service Workers)
    ├── src/
    │   ├── components/           # Reusable UI (Buttons, Drawers, Modals, Navbar)
    │   ├── hooks/                # Custom React Hooks
    │   ├── pages/                # High-level route views (Dashboard, Haircuts, Costs)
    │   ├── services/             # Axios API service classes
    │   ├── store/                # Zustand global state managers
    │   └── utils/                # Formatting helpers (Currency, Dates)
    └── tailwind.config.js        # Core design system definitions
```

## 🚀 Local Development

Follow these steps to spin up the full stack locally.

### 1. Database Setup
You will need a PostgreSQL database. Ensure you have your connection string ready.

### 2. Backend Setup
Navigate into the `backend` directory and install the Python dependencies:

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # (or venv/bin/activate on Mac/Linux)
pip install -r requirements.txt
```

Create a `.env` file in the `backend` root based on the `.env.example` structure:
```env
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=http://localhost:5173
```

Run database migrations to construct the tables:
```bash
alembic upgrade head
```

Boot the API server:
```bash
uvicorn app.main:app --reload --port 8000
```


### 3. Frontend Setup
In a new terminal, navigate to the frontend directory:

```bash
cd frontned
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---
<div align="center">
  <i>Designed and engineered with care for modern barbershop workflows.</i>
</div>
