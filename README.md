# CyberShield 360

CyberShield 360 is a production-quality MVP for affordable continuous cybersecurity monitoring for Kenyan SMEs. It is designed as a realistic demo SaaS platform for SOC-style visibility, security posture tracking, alerting, asset discovery, and AI-assisted analysis.

## Problem

SMEs often lack budget for a dedicated SOC, leaving them exposed to asset drift, unmanaged vulnerabilities, weak alerting, and slow incident response.

## Solution

CyberShield 360 centralises asset visibility, vulnerability review, security scoring, alert handling, incident workflows, and management-ready reporting into a lightweight platform built for small and medium enterprises.

## Features

- Secure authentication and RBAC
- Asset and network management
- Authorised scan workflow
- Security health scoring
- Vulnerability management
- Event monitoring and alerts
- Incident workflow
- AI-assisted analysis grounded in app data
- Professional dashboard and reporting

## Quick start

1. Create a Python virtual environment and install backend dependencies.
2. Install the frontend dependencies in the `frontend` directory.
3. Start the backend API.
4. Start the frontend dev server.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Demo mode

The application ships with a demo organisation and telemetry generated from the app itself. The UI clearly labels these assets as demo data and the API provides a safe example of realistic telemetry.

## Security notes

- Sensitive scanning is intentionally limited to explicitly authorised networks.
- The AI layer is constrained to structured records from the database and does not fabricate incidents or vulnerabilities.
- All data is simulated in the demo environment and labelled clearly.
