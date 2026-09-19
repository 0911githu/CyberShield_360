from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone


def build_demo_payload():
    now = datetime.now(timezone.utc)
    org_id = str(uuid.uuid4())
    assets = [
        {'id': str(uuid.uuid4()), 'name': 'SERVER-01', 'ip_address': '10.10.0.11', 'asset_type': 'server', 'risk_level': 'high', 'status': 'active'},
        {'id': str(uuid.uuid4()), 'name': 'WORKSTATION-07', 'ip_address': '10.10.0.42', 'asset_type': 'endpoint', 'risk_level': 'medium', 'status': 'active'},
        {'id': str(uuid.uuid4()), 'name': 'GATEWAY-01', 'ip_address': '10.10.0.1', 'asset_type': 'network', 'risk_level': 'high', 'status': 'active'},
    ]
    vulnerabilities = [
        {'id': str(uuid.uuid4()), 'title': 'OpenSSH 8.2 privilege escalation', 'severity': 'critical', 'asset': 'SERVER-01', 'status': 'open'},
        {'id': str(uuid.uuid4()), 'title': 'Outdated Windows build on finance laptop', 'severity': 'high', 'asset': 'WORKSTATION-07', 'status': 'open'},
    ]
    alerts = [
        {'id': str(uuid.uuid4()), 'title': 'Repeated failed login attempts', 'severity': 'high', 'status': 'new'},
        {'id': str(uuid.uuid4()), 'title': 'Critical vulnerability on SERVER-01', 'severity': 'critical', 'status': 'investigating'},
    ]
    incidents = [
        {'id': str(uuid.uuid4()), 'title': 'Suspicious privileged access attempt', 'severity': 'high', 'status': 'investigating', 'opened_at': (now - timedelta(hours=3)).isoformat()},
    ]
    events = [
        {'id': str(uuid.uuid4()), 'timestamp': (now - timedelta(minutes=12)).isoformat(), 'event_type': 'LOGIN_FAILURE', 'severity': 'medium', 'source': 'identity', 'message': 'Multiple failed login attempts from 10.10.0.12'},
        {'id': str(uuid.uuid4()), 'timestamp': (now - timedelta(minutes=25)).isoformat(), 'event_type': 'ASSET_DISCOVERED', 'severity': 'low', 'source': 'network_scan', 'message': 'New workstation discovered on lab subnet'},
        {'id': str(uuid.uuid4()), 'timestamp': (now - timedelta(minutes=44)).isoformat(), 'event_type': 'VULNERABILITY_DETECTED', 'severity': 'high', 'source': 'scanner', 'message': 'Critical vulnerability identified on SERVER-01'},
    ]
    score = 74
    return {
        'organisation': {'id': org_id, 'name': 'Demo Organisation'},
        'user': {
            'id': str(uuid.uuid4()),
            'email': 'admin@demo.cybershield.local',
            'full_name': 'Demo Admin',
            'password': 'DemoPass123!',
            'role': 'ORGANISATION_ADMIN',
            'org_id': org_id,
        },
        'metrics': {
            'security_score': score,
            'asset_count': len(assets),
            'critical_vulnerabilities': 2,
            'open_alerts': 2,
            'active_incidents': 1,
            'security_events': len(events),
            'trend': [65, 68, 70, 72, 74],
            'risks': [
                {'name': 'Server-01', 'value': 92, 'severity': 'critical'},
                {'name': 'Gateway-01', 'value': 84, 'severity': 'high'},
                {'name': 'Workstation-07', 'value': 73, 'severity': 'medium'},
            ],
            'recommendations': [
                {'title': 'Patch critical server vulnerability', 'priority': 1, 'status': 'open'},
                {'title': 'Enable MFA for privileged accounts', 'priority': 2, 'status': 'planned'},
                {'title': 'Verify backup completion status', 'priority': 3, 'status': 'open'},
            ],
            'alert_trend': [
                {'day': 'Mon', 'alerts': 4},
                {'day': 'Tue', 'alerts': 5},
                {'day': 'Wed', 'alerts': 3},
                {'day': 'Thu', 'alerts': 7},
                {'day': 'Fri', 'alerts': 6},
            ],
        },
        'assets': assets,
        'vulnerabilities': vulnerabilities,
        'alerts': alerts,
        'incidents': incidents,
        'events': events,
    }
