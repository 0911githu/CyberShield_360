# CyberShield 360 Architecture

## Overview

CyberShield 360 is a lightweight SOC platform for SMEs. It brings together asset discovery, vulnerability assessment, alert handling, reporting, and AI-assisted analysis in a single operational view.

## Core flow

1. Users authenticate through a secure API.
2. Assets and networks are registered under an organisation.
3. Discovery and scanning workers populate asset and security-event records.
4. The risk engine evaluates health across the monitored estate.
5. Alerts and incidents are generated from rules and event streams.
6. Executive and technical reports are generated from the same system data.

## Components

- Frontend: Vite + React dashboard for operational visibility
- API: FastAPI with Pydantic validation and RBAC-ready design
- Data layer: SQLite in the demo environment, PostgreSQL-ready architecture
- Cache/job layer: Redis and Celery-ready worker interfaces
- Security logic: demo risk and scoring engine grounded in system data

## Demo-safe constraints

The system is explicitly designed for authorised demo use only. The AI analysis layer is restricted to structured records and does not invent vulnerabilities or incidents.
