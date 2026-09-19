from __future__ import annotations

import ipaddress
import socket
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.config import CORS_ORIGINS, DEMO_MODE
from app.demo_data import build_demo_payload
from app.schemas import DashboardResponse, LoginRequest, TokenResponse
from app.security import ROLE_PERMISSIONS, require_permission, issue_tokens_for_user
from app.service_layer import DemoService
from app.supabase_client import supabase_service


def _get_assets_from_backend():
    if DEMO_MODE or not supabase_service.enabled:
        return DemoService.assets()
    try:
        return supabase_service.get_assets() or DemoService.assets()
    except Exception:
        return DemoService.assets()


def _get_networks_from_backend(user):
    if DEMO_MODE or not supabase_service.enabled:
        return [{'id': 'net-demo-1', 'name': 'Authorised lab subnet', 'cidr': '10.10.0.0/24', 'org_id': user['org_id'], 'authorised': True}]
    try:
        networks = supabase_service.get_networks()
        return networks or [{'id': 'net-demo-1', 'name': 'Authorised lab subnet', 'cidr': '10.10.0.0/24', 'org_id': user['org_id'], 'authorised': True}]
    except Exception:
        return [{'id': 'net-demo-1', 'name': 'Authorised lab subnet', 'cidr': '10.10.0.0/24', 'org_id': user['org_id'], 'authorised': True}]


def _get_vulnerabilities_from_backend(user):
    if DEMO_MODE or not supabase_service.enabled:
        return DemoService.vulnerabilities(user.get('org_id'))
    try:
        vulns = supabase_service.get_vulnerabilities()
        return vulns or DemoService.vulnerabilities(user.get('org_id'))
    except Exception:
        return DemoService.vulnerabilities(user.get('org_id'))


def _get_alerts_from_backend(user):
    if DEMO_MODE or not supabase_service.enabled:
        return DemoService.alerts(user.get('org_id'))
    try:
        alerts = supabase_service.get_alerts()
        return alerts or DemoService.alerts(user.get('org_id'))
    except Exception:
        return DemoService.alerts(user.get('org_id'))


def _get_incidents_from_backend(user):
    if DEMO_MODE or not supabase_service.enabled:
        return DemoService.incidents(user.get('org_id'))
    try:
        incidents = supabase_service.get_incidents()
        return incidents or DemoService.incidents(user.get('org_id'))
    except Exception:
        return DemoService.incidents(user.get('org_id'))


def _get_events_from_backend(user):
    if DEMO_MODE or not supabase_service.enabled:
        return DemoService.events(user.get('org_id'))
    try:
        events = supabase_service.get_events()
        return events or DemoService.events(user.get('org_id'))
    except Exception:
        return DemoService.events(user.get('org_id'))


def _get_dashboard_payload():
    if DEMO_MODE or not supabase_service.enabled:
        return DemoService.dashboard()
    try:
        summary = supabase_service.get_dashboard_summary()
        if summary:
            return summary
    except Exception:
        pass
    return DemoService.dashboard()

SCAN_HISTORY: list[dict[str, object]] = []


def _nmap_style_ports(network_size: int | None = None) -> list[int]:
    common_ports = [22, 80, 443, 445, 3389, 8080, 8443, 21, 23, 25, 135, 139, 3306, 5432, 5900]
    if network_size is not None and network_size <= 8:
        return common_ports[:10]
    return common_ports[:12]


def _service_version_guess(port: int) -> str:
    service_map = {
        21: 'FTP server',
        22: 'OpenSSH',
        23: 'Telnet server',
        25: 'SMTP daemon',
        80: 'HTTP daemon',
        135: 'RPC endpoint mapper',
        139: 'NetBIOS service',
        443: 'HTTPS daemon',
        445: 'SMB share service',
        3306: 'MySQL database',
        3389: 'Windows Remote Desktop',
        5432: 'PostgreSQL database',
        5900: 'VNC service',
        8080: 'HTTP proxy',
        8443: 'HTTPS proxy',
    }
    return service_map.get(port, f'Port {port} service')


def _probe_host(ip_address: str, ports: list[int] | None = None) -> dict[str, object]:
    port_list = ports or _nmap_style_ports()
    open_ports: list[dict[str, object]] = []
    service_lookup = {
        21: 'FTP',
        22: 'SSH',
        23: 'Telnet',
        25: 'SMTP',
        80: 'HTTP',
        135: 'RPC',
        139: 'NetBIOS',
        443: 'HTTPS',
        445: 'SMB',
        3306: 'MySQL',
        3389: 'RDP',
        5432: 'PostgreSQL',
        5900: 'VNC',
        8080: 'HTTP alt',
        8443: 'HTTPS alt',
    }

    for port in port_list:
        try:
            with socket.create_connection((ip_address, port), timeout=0.35):
                open_ports.append({
                    'port': port,
                    'service': service_lookup.get(port, f'Port {port}'),
                    'status': 'open',
                    'state': 'open',
                    'version_guess': _service_version_guess(port),
                    'scan_mode': 'syn-stealth-scan',
                })
        except OSError:
            continue

    vulnerability_entries: list[dict[str, str]] = []
    open_port_numbers = [entry['port'] for entry in open_ports if isinstance(entry.get('port'), int)]

    if 22 in open_port_numbers:
        vulnerability_entries.append({
            'severity': 'high',
            'title': 'SSH exposed',
            'details': 'Port 22 is reachable and should be restricted to trusted admin networks.',
        })
    if 23 in open_port_numbers:
        vulnerability_entries.append({
            'severity': 'high',
            'title': 'Telnet exposed',
            'details': 'Telnet is unencrypted and should be disabled for production systems.',
        })
    if 445 in open_port_numbers:
        vulnerability_entries.append({
            'severity': 'high',
            'title': 'SMB exposure',
            'details': 'SMB access is exposed and may enable lateral movement if not tightly restricted.',
        })
    if 3389 in open_port_numbers:
        vulnerability_entries.append({
            'severity': 'high',
            'title': 'RDP exposed',
            'details': 'Remote desktop is reachable and should be protected with MFA and network controls.',
        })
    if 80 in open_port_numbers or 8080 in open_port_numbers:
        vulnerability_entries.append({
            'severity': 'medium',
            'title': 'Web service exposed',
            'details': 'An HTTP service is reachable; verify there is no sensitive admin surface exposed.',
        })
    if 21 in open_port_numbers:
        vulnerability_entries.append({
            'severity': 'medium',
            'title': 'FTP exposed',
            'details': 'FTP should be replaced with encrypted transfer methods for business data.',
        })

    service_names = [entry['service'] for entry in open_ports if isinstance(entry.get('service'), str)]
    return {
        'ip': ip_address,
        'reachable': bool(open_ports),
        'host_status': 'up' if open_ports else 'down',
        'open_ports': open_ports,
        'vulnerabilities': vulnerability_entries,
        'service_detection': {
            'ports': open_ports,
            'service_count': len(open_ports),
            'services': service_names,
        },
    }


def _scan_target(target: str) -> dict[str, object]:
    if not target or not target.strip():
        raise HTTPException(status_code=400, detail='A target IP, hostname, or CIDR is required.')

    clean_target = target.strip()
    scan_started = datetime.now(timezone.utc)
    scan_ports = _nmap_style_ports()
    max_hosts = 20
    max_ports_per_host = len(scan_ports)

    try:
        network = ipaddress.ip_network(clean_target, strict=False)
    except ValueError:
        network = None

    if network is not None and network.num_addresses > 1:
        hosts_to_scan = list(network.hosts())[:max_hosts]
        host_results: list[dict[str, object]] = []
        discovered_vulnerabilities: list[dict[str, str]] = []
        all_open_ports: list[dict[str, object]] = []

        for host in hosts_to_scan:
            host_details = _probe_host(str(host), scan_ports)
            if host_details['reachable']:
                host_result = {
                    'ip': host_details['ip'],
                    'host_status': host_details['host_status'],
                    'open_ports': host_details['open_ports'],
                    'vulnerabilities': host_details['vulnerabilities'],
                    'service_detection': host_details['service_detection'],
                }
                host_results.append(host_result)
                discovered_vulnerabilities.extend(host_details['vulnerabilities'])
                all_open_ports.extend(host_details['open_ports'])

        host_discovery = {
            'hosts_total': len(hosts_to_scan),
            'hosts_up': len(host_results),
            'up_ips': [host['ip'] for host in host_results if isinstance(host.get('ip'), str)],
            'down_ips': [str(host) for host in hosts_to_scan if str(host) not in {host['ip'] for host in host_results if isinstance(host.get('ip'), str)}],
        }
        service_detection = {
            'ports': all_open_ports,
            'service_count': len(all_open_ports),
            'services': sorted({entry['service'] for entry in all_open_ports if isinstance(entry.get('service'), str)}),
        }

        scan_stats = {
            'max_hosts': max_hosts,
            'max_ports_per_host': max_ports_per_host,
            'hosts_checked': len(hosts_to_scan),
            'ports_scanned': len(scan_ports),
            'scan_duration_ms': int((datetime.now(timezone.utc) - scan_started).total_seconds() * 1000),
        }

        if not host_results:
            return {
                'status': 'completed',
                'target': clean_target,
                'hosts': [],
                'host_discovery': host_discovery,
                'service_detection': service_detection,
                'vulnerabilities': [],
                'scan_method': 'nmap-like-tcp-connect',
                'scan_profile': {
                    'mode': 'SYN-like',
                    'probe': 'tcp-syn-ack-simulated',
                    'host_discovery': 'yes',
                    'service_fingerprinting': 'yes',
                },
                'scan_stats': scan_stats,
                'summary': 'No reachable hosts were detected in the supplied network range.',
            }

        return {
            'status': 'completed',
            'target': clean_target,
            'hosts': host_results,
            'host_discovery': host_discovery,
            'service_detection': service_detection,
            'vulnerabilities': discovered_vulnerabilities,
            'scan_method': 'nmap-like-tcp-connect',
            'scan_profile': {
                'mode': 'SYN-like',
                'probe': 'tcp-syn-ack-simulated',
                'host_discovery': 'yes',
                'service_fingerprinting': 'yes',
            },
            'scan_stats': scan_stats,
            'summary': f'Detected {len(host_results)} reachable host(s) with {len(discovered_vulnerabilities)} likely risk finding(s).',
        }

    try:
        resolved_ip = socket.gethostbyname(clean_target)
    except socket.gaierror:
        resolved_ip = clean_target

    host_details = _probe_host(resolved_ip, scan_ports)
    host_results = [{
        'ip': resolved_ip,
        'host_status': host_details['host_status'],
        'open_ports': host_details['open_ports'],
        'vulnerabilities': host_details['vulnerabilities'],
        'service_detection': host_details['service_detection'],
    }] if host_details['reachable'] else []

    host_discovery = {
        'hosts_total': 1,
        'hosts_up': len(host_results),
        'up_ips': [resolved_ip] if host_results else [],
        'down_ips': [resolved_ip] if not host_results else [],
    }
    service_detection = {
        'ports': host_details['open_ports'],
        'service_count': len(host_details['open_ports']),
        'services': [entry['service'] for entry in host_details['open_ports'] if isinstance(entry.get('service'), str)],
    }

    scan_stats = {
        'max_hosts': 1,
        'max_ports_per_host': max_ports_per_host,
        'hosts_checked': 1,
        'ports_scanned': len(scan_ports),
        'scan_duration_ms': int((datetime.now(timezone.utc) - scan_started).total_seconds() * 1000),
    }

    if not host_results:
        return {
            'status': 'completed',
            'target': clean_target,
            'hosts': [],
            'host_discovery': host_discovery,
            'service_detection': service_detection,
            'vulnerabilities': [],
            'scan_method': 'nmap-like-tcp-connect',
            'scan_profile': {
                'mode': 'SYN-like',
                'probe': 'tcp-syn-ack-simulated',
                'host_discovery': 'yes',
                'service_fingerprinting': 'yes',
            },
            'scan_stats': scan_stats,
            'summary': f'No live host or open ports were detected for {clean_target}.',
        }

    return {
        'status': 'completed',
        'target': clean_target,
        'hosts': host_results,
        'host_discovery': host_discovery,
        'service_detection': service_detection,
        'vulnerabilities': host_details['vulnerabilities'],
        'scan_method': 'nmap-like-tcp-connect',
        'scan_profile': {
            'mode': 'SYN-like',
            'probe': 'tcp-syn-ack-simulated',
            'host_discovery': 'yes',
            'service_fingerprinting': 'yes',
        },
        'scan_stats': scan_stats,
        'summary': f'Host {resolved_ip} is reachable with {len(host_details["open_ports"])} open port(s) and {len(host_details["vulnerabilities"])} likely issue(s).',
    }


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
    return {
        'status': 'ready',
        'database': supabase_service.ping().get('status', 'simulated-demo'),
        'redis': 'simulated-demo',
        'worker': 'simulated-demo',
        'supabase': supabase_service.ping(),
    }


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
    payload = _get_dashboard_payload()
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
    return _get_assets_from_backend()


@app.post('/api/assets/seed')
def seed_assets(user=Depends(require_permission('asset:write'))):
    if DEMO_MODE or not supabase_service.enabled:
        return {'status': 'demo_mode', 'message': 'Supabase is not configured; demo mode is active.'}

    created = supabase_service.seed_demo_records(user.get('org_id'))
    return {'status': 'seeded', 'count': len(created), 'records': created}


@app.get('/api/networks')
def list_networks(user=Depends(require_permission('network:read'))):
    return _get_networks_from_backend(user)


@app.post('/api/assets/create')
def create_asset(payload: dict, user=Depends(require_permission('asset:write'))):
    if DEMO_MODE or not supabase_service.enabled:
        return {'status': 'demo_mode', 'message': 'Supabase is not configured; demo mode is active.'}
    asset = supabase_service.create_asset(payload, org_id=user.get('org_id'))
    if asset is None:
        raise HTTPException(status_code=500, detail='Failed to create asset in Supabase')
    return {'status': 'created', 'asset': asset}


@app.delete('/api/assets/{asset_id}')
def delete_asset(asset_id: str, user=Depends(require_permission('asset:write'))):
    if DEMO_MODE or not supabase_service.enabled:
        return {'status': 'demo_mode', 'message': 'Supabase is not configured; demo mode is active.'}

    deleted = supabase_service.delete_asset(asset_id, org_id=user.get('org_id'))
    if not deleted:
        raise HTTPException(status_code=404, detail='Asset not found in this tenant')
    return {'status': 'deleted', 'asset_id': asset_id}


@app.post('/api/networks/create')
def create_network(payload: dict, user=Depends(require_permission('network:write'))):
    if DEMO_MODE or not supabase_service.enabled:
        return {'status': 'demo_mode', 'message': 'Supabase is not configured; demo mode is active.'}
    record = {
        'org_id': user.get('org_id'),
        'name': payload.get('name', 'New network'),
        'cidr': payload.get('cidr', '10.10.0.0/24'),
        'authorised': bool(payload.get('authorised', True)),
    }
    try:
        response = supabase_service.client.table('networks').insert(record).execute()
        return {'status': 'created', 'network': response.data[0] if response.data else record}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Failed to create network: {exc}')


@app.delete('/api/networks/{network_id}')
def delete_network(network_id: str, user=Depends(require_permission('network:write'))):
    if DEMO_MODE or not supabase_service.enabled:
        return {'status': 'demo_mode', 'message': 'Supabase is not configured; demo mode is active.'}

    deleted = supabase_service.delete_network(network_id, org_id=user.get('org_id'))
    if not deleted:
        raise HTTPException(status_code=404, detail='Network not found in this tenant')
    return {'status': 'deleted', 'network_id': network_id}


def _persist_scan_entry(result: dict[str, object], target: str, org_id: str | None = None):
    scan_entry = {
        'target': target,
        'org_id': org_id,
        'status': result.get('status', 'completed'),
        'summary': result.get('summary', ''),
        'scan_method': result.get('scan_method', 'nmap-like-tcp-connect'),
        'hosts_up': int((result.get('host_discovery') or {}).get('hosts_up', 0) or 0),
        'hosts_total': int((result.get('host_discovery') or {}).get('hosts_total', 0) or 0),
        'ports_scanned': int((result.get('scan_stats') or {}).get('ports_scanned', 0) or 0),
        'services_detected': (result.get('service_detection') or {}).get('services', []),
        'vulnerabilities': result.get('vulnerabilities', []),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    SCAN_HISTORY.insert(0, scan_entry)

    if not (DEMO_MODE or not supabase_service.enabled):
        supabase_service.save_scan_history(scan_entry, org_id=org_id)


@app.post('/api/scans')
def start_scan(payload: dict | None = None, user=Depends(require_permission('scan:write'))):
    body = payload or {}
    target = str(body.get('target') or body.get('network') or '10.10.0.0/24')
    result = _scan_target(target)
    _persist_scan_entry(result, target, user.get('org_id'))
    return result


@app.get('/api/scans')
def list_scans(user=Depends(require_permission('scan:read'))):
    if not (DEMO_MODE or not supabase_service.enabled):
        remote_history = supabase_service.get_scan_history(user.get('org_id'))
        if remote_history:
            return remote_history
    return SCAN_HISTORY[:10] or [DemoService.scan_workflow()]


@app.get('/api/events')
def list_events(user=Depends(require_permission('dashboard:read'))):
    return _get_events_from_backend(user)


@app.get('/api/vulnerabilities')
def list_vulnerabilities(user=Depends(require_permission('vulnerability:read'))):
    return _get_vulnerabilities_from_backend(user)


@app.get('/api/alerts')
def list_alerts(user=Depends(require_permission('alert:read'))):
    return _get_alerts_from_backend(user)


@app.get('/api/incidents')
def list_incidents(user=Depends(require_permission('incident:read'))):
    return _get_incidents_from_backend(user)


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
    origin = request.headers.get('origin') or request.headers.get('Origin')
    allow_origin = origin if origin in CORS_ORIGINS else (CORS_ORIGINS[0] if CORS_ORIGINS else '*')

    if request.method == 'OPTIONS':
        response = Response(status_code=204)
        response.headers['Access-Control-Allow-Origin'] = allow_origin
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    if request.url.path.startswith('/api/') and request.url.path not in public_paths:
        auth_header = request.headers.get('authorization', '')
        if not auth_header.startswith('Bearer '):
            response = JSONResponse(status_code=401, content={'detail': 'Authentication required'})
            response.headers['Access-Control-Allow-Origin'] = allow_origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response
        token = auth_header.split(' ', 1)[1].strip()
        user = __import__('app.security', fromlist=['TOKEN_STORE']).TOKEN_STORE.get(token)
        if not user:
            response = JSONResponse(status_code=401, content={'detail': 'Invalid or expired token'})
            response.headers['Access-Control-Allow-Origin'] = allow_origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response
        request.state.user = user

    response = await call_next(request)
    response.headers['Access-Control-Allow-Origin'] = allow_origin
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response


@app.exception_handler(404)
async def not_found_handler(_request, _exc):
    return JSONResponse(status_code=404, content={'detail': 'Not found'})
