from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import CORS_ORIGINS, DEMO_MODE
from app.demo_data import build_demo_payload
from app.schemas import DashboardResponse, LoginRequest, TokenResponse
from app.security import ROLE_PERMISSIONS, require_permission, issue_tokens_for_user
from app.service_layer import DemoService

app = FastAPI(title='CyberShield 360 API', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def _build_demo_response():
    return build_demo_payload()


@app.get('/health')
def health_check():
    return {'status': 'ok', 'service': 'cybershield-api', 'timestamp': datetime.now(timezone.utc).isoformat()}


@app.get('/ready')
def ready_check():
    return {'status': 'ready', 'database': 'simulated-demo', 'redis': 'simulated-demo', 'worker': 'simulated-demo'}


@app.post('/api/auth/login', response_model=TokenResponse)
def login(payload: LoginRequest):
    demo = _build_demo_response()
    if payload.email != demo['user']['email'] or payload.password != demo['user']['password']:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    access_token, refresh_token = issue_tokens_for_user(demo['user'])
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@app.get('/api/auth/me')
def get_current_session(request: Request):
    user = request.state.user if hasattr(request.state, 'user') else None
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return {'id': user['id'], 'email': user['email'], 'role': user['role'], 'org_id': user['org_id']}


@app.get('/api/dashboard', response_model=DashboardResponse)
def get_dashboard():
    payload = DemoService.dashboard()
    return DashboardResponse(
        security_score=payload['security_score'],
        asset_count=payload['asset_count'],
        critical_vulnerabilities=payload['critical_vulnerabilities'],
        open_alerts=payload['open_alerts'],
        active_incidents=payload['active_incidents'],
        security_events=payload['security_events'],
        trend=payload['trend'],
        risks=payload['risks'],
        recommendations=payload['recommendations'],
        alert_trend=payload['alert_trend'],
    )


@app.get('/api/assets')
def list_assets(user=Depends(require_permission('asset:read'))):
    return DemoService.assets(user.get('org_id'))


@app.get('/api/networks')
def list_networks(user=Depends(require_permission('network:read'))):
    return [{'id': 'net-demo-1', 'name': 'Authorised lab subnet', 'cidr': '10.10.0.0/24', 'org_id': user['org_id'], 'authorised': True}]


@app.post('/api/scans')
def start_scan(user=Depends(require_permission('scan:write'))):
    return DemoService.scan_workflow()


@app.get('/api/scans')
def list_scans(user=Depends(require_permission('scan:read'))):
    return [DemoService.scan_workflow()]


@app.get('/api/events')
def list_events(user=Depends(require_permission('dashboard:read'))):
    return DemoService.events(user.get('org_id'))


@app.get('/api/vulnerabilities')
def list_vulnerabilities(user=Depends(require_permission('vulnerability:read'))):
    return DemoService.vulnerabilities(user.get('org_id'))


@app.get('/api/alerts')
def list_alerts(user=Depends(require_permission('alert:read'))):
    return DemoService.alerts(user.get('org_id'))


@app.get('/api/incidents')
def list_incidents(user=Depends(require_permission('incident:read'))):
    return DemoService.incidents(user.get('org_id'))


@app.get('/api/recommendations')
def list_recommendations(user=Depends(require_permission('dashboard:read'))):
    return DemoService.dashboard(user.get('org_id'))['recommendations']


@app.get('/api/reports')
def list_reports(user=Depends(require_permission('report:read'))):
    return [DemoService.reports(user.get('org_id'))]


@app.post('/api/reports')
def generate_report(user=Depends(require_permission('report:write'))):
    return DemoService.reports(user.get('org_id'))


@app.post('/api/ai/analyse')
def analyse_ai(user=Depends(require_permission('ai:read'))):
    return {
        'summary': 'The highest-risk asset is SERVER-01 with active critical vulnerabilities and elevated privilege exposure.',
        'facts': ['2 critical vulnerabilities are currently open', '1 active incident is under investigation', 'security score is 74/100'],
        'recommendations': ['Patch critical server exposure immediately', 'Enable MFA for administrative accounts', 'Confirm backup integrity before next maintenance window'],
        'confidence': 'medium',
        'data_sources': ['demo_assets', 'demo_vulnerabilities', 'demo_incidents'],
        'tenant_id': user['org_id'],
    }


@app.middleware('http')
async def auth_middleware(request: Request, call_next):
    public_paths = {'/api/auth/login', '/api/dashboard'}
    if request.url.path.startswith('/api/') and request.url.path not in public_paths:
        auth_header = request.headers.get('authorization', '')
        if not auth_header.startswith('Bearer '):
            return JSONResponse(status_code=401, content={'detail': 'Authentication required'})
        token = auth_header.split(' ', 1)[1].strip()
        user = __import__('app.security', fromlist=['TOKEN_STORE']).TOKEN_STORE.get(token)
        if not user:
            return JSONResponse(status_code=401, content={'detail': 'Invalid or expired token'})
        request.state.user = user
    return await call_next(request)


@app.exception_handler(404)
async def not_found_handler(_request, _exc):
    return JSONResponse(status_code=404, content={'detail': 'Not found'})
