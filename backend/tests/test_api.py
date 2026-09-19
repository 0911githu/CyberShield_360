from fastapi.testclient import TestClient

from app.main import app
from app.security import TOKEN_STORE, issue_tokens_for_user

client = TestClient(app)


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
