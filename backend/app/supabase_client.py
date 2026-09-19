from __future__ import annotations

from typing import Any

from supabase import Client, create_client

from app.config import DEMO_MODE, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, USE_SUPABASE


class SupabaseService:
    def __init__(self) -> None:
        self.enabled = USE_SUPABASE and bool(SUPABASE_URL)
        self.client: Client | None = None

        if self.enabled:
            self.client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)

    def ping(self) -> dict[str, Any]:
        if not self.enabled or self.client is None:
            return {'status': 'disabled', 'database': 'supabase-not-configured'}

        try:
            response = self.client.table('assets').select('id').limit(1).execute()
            return {'status': 'ok', 'database': 'supabase', 'rows': len(response.data or [])}
        except Exception as exc:  # pragma: no cover - config/runtime check
            return {'status': 'error', 'database': 'supabase', 'detail': str(exc)}

    def _list(self, table_name: str) -> list[dict[str, Any]]:
        if DEMO_MODE or not self.enabled or self.client is None:
            return []

        try:
            response = self.client.table(table_name).select('*').execute()
            return response.data or []
        except Exception:
            return []

    def get_assets(self) -> list[dict[str, Any]]:
        return self._list('assets')

    def get_networks(self) -> list[dict[str, Any]]:
        return self._list('networks')

    def get_vulnerabilities(self) -> list[dict[str, Any]]:
        return self._list('vulnerabilities')

    def get_alerts(self) -> list[dict[str, Any]]:
        return self._list('alerts')

    def get_incidents(self) -> list[dict[str, Any]]:
        return self._list('incidents')

    def get_events(self) -> list[dict[str, Any]]:
        return self._list('security_events')

    def get_scan_history(self, org_id: str | None = None) -> list[dict[str, Any]]:
        if DEMO_MODE or not self.enabled or self.client is None:
            return []

        try:
            query = self.client.table('scan_history').select('*')
            if org_id:
                query = query.eq('org_id', org_id)
            response = query.order('created_at', desc=True).limit(10).execute()
            return response.data or []
        except Exception:
            return []

    def save_scan_history(self, payload: dict[str, Any], org_id: str | None = None) -> dict[str, Any] | None:
        if DEMO_MODE or not self.enabled or self.client is None:
            return None

        record = {
            'org_id': org_id or payload.get('org_id') or 'demo-org',
            'target': payload.get('target') or 'unknown',
            'scan_method': payload.get('scan_method') or 'nmap-like-tcp-connect',
            'status': payload.get('status') or 'completed',
            'summary': payload.get('summary') or '',
            'hosts_up': int(payload.get('hosts_up') or 0),
            'hosts_total': int(payload.get('hosts_total') or 0),
            'ports_scanned': int(payload.get('ports_scanned') or 0),
            'services_detected': payload.get('services_detected') or [],
            'vulnerabilities': payload.get('vulnerabilities') or [],
            'created_at': payload.get('created_at') or __import__('datetime').datetime.utcnow().isoformat(),
        }

        try:
            response = self.client.table('scan_history').insert(record).execute()
            if response.data:
                return response.data[0]
            return record
        except Exception:
            return None

    def get_dashboard_summary(self) -> dict[str, Any]:
        if DEMO_MODE or not self.enabled or self.client is None:
            return {}

        try:
            assets = self.get_assets()
            vulnerabilities = self.get_vulnerabilities()
            incidents = self.get_incidents()
            alerts = self.get_alerts()
            events = self.get_events()
            score = 75 if assets else 0
            return {
                'security_score': score,
                'asset_count': len(assets),
                'critical_vulnerabilities': sum(1 for item in vulnerabilities if str(item.get('severity', '')).lower() in {'critical', 'high'}),
                'open_alerts': len(alerts),
                'active_incidents': len(incidents),
                'security_events': len(events),
                'trend': [65, 68, 71, 74, 78],
                'risks': [
                    {'name': asset.get('name', 'Asset'), 'value': 80 if asset.get('criticality') == 'critical' else 65, 'severity': asset.get('criticality', 'medium')}
                    for asset in assets[:3]
                ],
                'recommendations': [{'title': 'Review open findings in Supabase', 'priority': 1, 'status': 'open'}],
                'alert_trend': [{'day': 'Mon', 'alerts': 2}, {'day': 'Tue', 'alerts': 4}, {'day': 'Wed', 'alerts': 3}],
            }
        except Exception:
            return {}

    def normalize_asset_record(self, payload: dict[str, Any], org_id: str | None = None) -> dict[str, Any]:
        normalized = dict(payload)
        normalized['org_id'] = org_id or payload.get('org_id') or 'demo-org'
        normalized['name'] = payload.get('name') or 'Unnamed asset'
        normalized['type'] = payload.get('type') or payload.get('asset_type') or 'server'
        normalized['environment'] = payload.get('environment') or 'production'
        normalized['owner'] = payload.get('owner') or 'Unknown owner'
        normalized['ip_address'] = payload.get('ip_address') or '0.0.0.0'
        normalized['hostname'] = payload.get('hostname') or payload.get('name') or 'unknown-host'
        normalized['criticality'] = payload.get('criticality') or payload.get('risk_level') or 'medium'
        normalized['status'] = payload.get('status') or 'monitored'
        normalized['monitoring_enabled'] = bool(payload.get('monitoring_enabled', True))
        normalized['scan_interval_minutes'] = int(payload.get('scan_interval_minutes', 60))
        normalized['tags'] = payload.get('tags') or []
        normalized['last_seen_at'] = payload.get('last_seen_at')
        normalized.pop('asset_type', None)
        normalized.pop('risk_level', None)
        return normalized

    def create_asset(self, payload: dict[str, Any], org_id: str | None = None) -> dict[str, Any] | None:
        if DEMO_MODE or not self.enabled or self.client is None:
            return None

        record = self.normalize_asset_record(payload, org_id)
        try:
            response = self.client.table('assets').insert(record).execute()
            data = response.data or []
            if not data:
                return record
            row = dict(data[0])
            row['asset_type'] = row.get('type', row.get('asset_type', 'server'))
            row['risk_level'] = row.get('criticality', row.get('risk_level', 'medium'))
            return row
        except Exception:
            return None

    def delete_asset(self, asset_id: str, org_id: str | None = None) -> bool:
        if DEMO_MODE or not self.enabled or self.client is None:
            return False

        try:
            query = self.client.table('assets').select('*').eq('id', asset_id)
            if org_id:
                query = query.eq('org_id', org_id)
            result = query.execute()
            if not (result.data or []):
                return False
            delete_query = self.client.table('assets').delete().eq('id', asset_id)
            if org_id:
                delete_query = delete_query.eq('org_id', org_id)
            delete_query.execute()
            return True
        except Exception:
            return False

    def delete_network(self, network_id: str, org_id: str | None = None) -> bool:
        if DEMO_MODE or not self.enabled or self.client is None:
            return False

        try:
            query = self.client.table('networks').select('*').eq('id', network_id)
            if org_id:
                query = query.eq('org_id', org_id)
            result = query.execute()
            if not (result.data or []):
                return False
            delete_query = self.client.table('networks').delete().eq('id', network_id)
            if org_id:
                delete_query = delete_query.eq('org_id', org_id)
            delete_query.execute()
            return True
        except Exception:
            return False

    def seed_demo_records(self, org_id: str) -> list[dict[str, Any]]:
        if DEMO_MODE or not self.enabled or self.client is None:
            return []

        seed = [
            {
                'org_id': org_id,
                'name': 'SERVER-01',
                'type': 'server',
                'environment': 'production',
                'owner': 'Infrastructure',
                'ip_address': '10.10.0.11',
                'hostname': 'server-01.local',
                'criticality': 'critical',
                'status': 'monitored',
                'monitoring_enabled': True,
                'scan_interval_minutes': 60,
                'tags': ['critical', 'linux'],
            },
            {
                'org_id': org_id,
                'name': 'WORKSTATION-07',
                'type': 'endpoint',
                'environment': 'production',
                'owner': 'Operations',
                'ip_address': '10.10.0.42',
                'hostname': 'workstation-07.local',
                'criticality': 'medium',
                'status': 'monitored',
                'monitoring_enabled': True,
                'scan_interval_minutes': 60,
                'tags': ['windows', 'endpoint'],
            },
            {
                'org_id': org_id,
                'name': 'Nairobi DC',
                'cidr': '10.10.0.0/24',
                'authorised': True,
            },
        ]

        created_records: list[dict[str, Any]] = []
        for item in seed:
            if 'cidr' in item:
                try:
                    response = self.client.table('networks').insert(item).execute()
                    if response.data:
                        created_records.append(response.data[0])
                except Exception:
                    continue
            else:
                try:
                    response = self.client.table('assets').insert(self.normalize_asset_record(item, org_id)).execute()
                    if response.data:
                        created_records.append(response.data[0])
                except Exception:
                    continue
        return created_records


supabase_service = SupabaseService()
