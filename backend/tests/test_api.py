from fastapi.testclient import TestClient

from app.main import _scan_target, app
from app.security import TOKEN_STORE, issue_tokens_for_user
from app.supabase_client import SupabaseService

client = TestClient(app)


class FakeSupabaseResult:
    def __init__(self, data):
        self.data = data


class FakeSupabaseTable:
    def __init__(self, service):
        self.service = service
        self.payload = None
        self.org_id = None
        self.record_id = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.org_id = value
        return self

    def insert(self, payload):
        self.payload = payload
        return self

    def delete(self):
        return self

    def execute(self):
        if self.record_id is not None:
            return FakeSupabaseResult([])
        if self.payload is not None:
            return FakeSupabaseResult([{**self.payload, 'id': 'asset-123'}])
        return FakeSupabaseResult([{ 'id': 'asset-123', 'name': 'SERVER-01', 'type': 'server', 'criticality': 'critical', 'status': 'monitored', 'org_id': self.org_id }])


class FakeSupabaseClient:
    def __init__(self):
        self.table_name = None
        self.table_obj = None

    def table(self, name):
        self.table_name = name
        self.table_obj = FakeSupabaseTable(self)
        return self.table_obj


def test_health_endpoint():
    response = client.get('/health')
    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'ok'


def test_dashboard_endpoint_returns_metrics():
    response = client.get('/api/dashboard')
    assert response.status_code == 200
    payload = response.json()
    assert 'security_score' in payload
    assert 'asset_count' in payload
    assert 'critical_vulnerabilities' in payload


def test_demo_login_works():
    response = client.post('/api/auth/login', json={'email': 'admin@demo.cybershield.local', 'password': 'DemoPass123!'})
    assert response.status_code == 200
    body = response.json()
    assert 'access_token' in body
    assert 'refresh_token' in body


def test_assets_require_authentication():
    response = client.get('/api/assets')
    assert response.status_code == 401


def test_viewer_cannot_trigger_scan():
    viewer_user = {
        'id': 'viewer-1',
        'email': 'viewer@demo.cybershield.local',
        'role': 'VIEWER',
        'org_id': 'org-demo-1',
    }
    access_token, _ = issue_tokens_for_user(viewer_user)
    response = client.post('/api/scans', headers={'Authorization': f'Bearer {access_token}'})
    assert response.status_code == 403


def test_tokens_are_tenant_scoped():
    tenant_user = {
        'id': 'tenant-1',
        'email': 'tenant@demo.cybershield.local',
        'role': 'ORGANISATION_ADMIN',
        'org_id': 'acme-org-123',
    }
    token, _ = issue_tokens_for_user(tenant_user)
    response = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert response.json()['org_id'] == 'acme-org-123'
    assert token in TOKEN_STORE


def test_supabase_asset_creation_normalizes_row():
    service = SupabaseService()
    service.enabled = True
    service.client = FakeSupabaseClient()

    record = service.create_asset({
        'name': 'MAIL-01',
        'type': 'server',
        'environment': 'production',
        'owner': 'IT',
        'ip_address': '10.10.0.22',
        'hostname': 'mail-01.local',
        'criticality': 'high',
        'status': 'monitored',
        'org_id': 'acme-org-123',
    }, org_id='acme-org-123')

    assert record is not None
    assert record['asset_type'] == 'server'
    assert record['risk_level'] == 'high'
    assert record['status'] == 'monitored'


def test_supabase_insert_omits_unsupported_derived_fields():
    service = SupabaseService()
    service.enabled = True
    service.client = FakeSupabaseClient()

    payload = service.normalize_asset_record({
        'name': 'MAIL-01',
        'type': 'server',
        'environment': 'production',
        'owner': 'IT',
        'ip_address': '10.10.0.22',
        'hostname': 'mail-01.local',
        'criticality': 'high',
        'status': 'monitored',
        'org_id': 'acme-org-123',
        'asset_type': 'server',
        'risk_level': 'high',
    }, org_id='acme-org-123')

    assert 'asset_type' not in payload
    assert 'risk_level' not in payload
    assert payload['type'] == 'server'
    assert payload['criticality'] == 'high'


def test_network_scan_uses_efficient_nmap_style_limits():
    result = _scan_target('10.10.0.0/30')

    assert result['scan_method'] == 'nmap-like-tcp-connect'
    assert result['scan_stats']['max_hosts'] <= 20
    assert result['scan_stats']['max_ports_per_host'] <= 12
    assert result['scan_stats']['hosts_checked'] >= 1


def test_network_scan_reports_host_discovery_and_service_fingerprints():
    result = _scan_target('10.10.0.0/30')

    assert 'host_discovery' in result
    assert 'service_detection' in result
    assert 'hosts_up' in result['host_discovery']
    assert 'ports' in result['service_detection']
    assert 'host_status' in result['hosts'][0] if result['hosts'] else True


def test_delete_asset_route_requires_valid_auth():
    response = client.delete('/api/assets/asset-123')
    assert response.status_code == 401
