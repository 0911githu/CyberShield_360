from __future__ import annotations

from datetime import datetime
from typing import Any, List

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'


class UserSummary(BaseModel):
    id: str
    email: str
    full_name: str
    role: str


class DashboardResponse(BaseModel):
    security_score: int
    asset_count: int
    critical_vulnerabilities: int
    open_alerts: int
    active_incidents: int
    security_events: int
    trend: List[int]
    risks: List[dict[str, Any]]
    recommendations: List[dict[str, Any]]
    alert_trend: List[dict[str, int | str]]


class AssetSummary(BaseModel):
    id: str
    name: str
    ip_address: str
    asset_type: str
    risk_level: str
    status: str


class SecurityEventSummary(BaseModel):
    id: str
    timestamp: datetime
    event_type: str
    severity: str
    source: str
    message: str
