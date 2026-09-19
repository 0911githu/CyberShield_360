from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.demo_data import build_demo_payload


class DemoService:
    @staticmethod
    def dashboard(org_id: str | None = None) -> dict[str, Any]:
        payload = build_demo_payload()
        metrics = payload['metrics']
        return {
            'security_score': metrics['security_score'],
            'asset_count': metrics['asset_count'],
            'critical_vulnerabilities': metrics['critical_vulnerabilities'],
            'open_alerts': metrics['open_alerts'],
            'active_incidents': metrics['active_incidents'],
            'security_events': metrics['security_events'],
            'trend': metrics['trend'],
            'risks': metrics['risks'],
            'recommendations': metrics['recommendations'],
            'alert_trend': metrics['alert_trend'],
            'org_name': payload['organisation']['name'],
            'generated_at': datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def assets(org_id: str | None = None) -> list[dict[str, Any]]:
        return build_demo_payload()['assets']

    @staticmethod
    def vulnerabilities(org_id: str | None = None) -> list[dict[str, Any]]:
        return build_demo_payload()['vulnerabilities']

    @staticmethod
    def alerts(org_id: str | None = None) -> list[dict[str, Any]]:
        return build_demo_payload()['alerts']

    @staticmethod
    def incidents(org_id: str | None = None) -> list[dict[str, Any]]:
        return build_demo_payload()['incidents']

    @staticmethod
    def events(org_id: str | None = None) -> list[dict[str, Any]]:
        return build_demo_payload()['events']

    @staticmethod
    def reports(org_id: str | None = None) -> dict[str, Any]:
        payload = build_demo_payload()
        return {
            'organisation': payload['organisation']['name'],
            'period': 'Last 30 days',
            'security_health_score': payload['metrics']['security_score'],
            'executive_summary': 'The organisation remains operational, with one active investigation and a manageable but elevated critical exposure.',
            'assets_monitored': payload['metrics']['asset_count'],
            'critical_findings': payload['metrics']['critical_vulnerabilities'],
            'recommendations': payload['metrics']['recommendations'],
        }

    @staticmethod
    def scan_workflow() -> dict[str, Any]:
        return {
            'status': 'completed',
            'scan_id': 'scan-demo-001',
            'network': '10.10.0.0/24',
            'assets_detected': 3,
            'notes': 'Authorised lab discovery completed for the demo environment.',
        }
