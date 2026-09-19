# CyberShield 360

![CI](https://github.com/0911githu/CyberShield_360/actions/workflows/ci.yml/badge.svg)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB)
![React](https://img.shields.io/badge/React-19.2-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)

CyberShield 360 is a production-quality MVP for affordable continuous cybersecurity monitoring for Kenyan SMEs. It is designed as a realistic demo SaaS platform for SOC-style visibility, asset discovery, vulnerability monitoring, security posture tracking, alerting, and AI-assisted analysis.

## Why this project exists

SMEs often do not have the budget for a dedicated SOC, which leaves them exposed to asset drift, unmanaged vulnerabilities, weak alerting, and delayed remediation. CyberShield 360 gives them a lightweight operational view of their environment without requiring a large, expensive security team.

## Product overview

CyberShield 360 combines these capabilities into one dashboard:

- secure authentication and role-based access control
- asset registration and network discovery
- scan workflow tracking for authorised environments
- vulnerability and risk scoring
- incident and alert visibility
- executive and technical reporting
- AI-assisted analyst support grounded in structured app data

## Core demo flows

- Discover or register devices and assets
- Add network ranges for authorised monitoring
- Run a scan workflow against the asset inventory
- Review the health, risk, and vulnerability posture
- View operational and executive reporting

## Project architecture

- Frontend: React + TypeScript + Vite + Tailwind CSS
- API: FastAPI + Pydantic
- Data layer: demo-safe in-memory and structured seeded data
- Security model: tenant-aware identity and role-based access control

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

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3. Tests

```bash
cd backend
pytest -q
```

### 4. Production frontend build

```bash
cd frontend
npm run build
```

## Demo mode

The application ships with a demo organisation and telemetry generated from the app itself. The UI clearly labels these assets as demo data and the API provides a safe example of realistic telemetry.

## Security notes

- Sensitive scanning is intentionally limited to explicitly authorised networks.
- The AI layer is constrained to structured records from the database and does not fabricate incidents or vulnerabilities.
- All data is simulated in the demo environment and labelled clearly.
- Tenant separation and role validation are enforced in the app logic.

## Repository workflow

This repository is structured for a clean software delivery flow:

- `main`: release-ready branch
- `develop`: active integration branch for ongoing work
- feature branches: used for individual improvements and fixes

## Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/security.md](docs/security.md)
- [docs/asset-monitoring.md](docs/asset-monitoring.md)
