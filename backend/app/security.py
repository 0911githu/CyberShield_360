from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

from fastapi import HTTPException, Request, status

ROLE_PERMISSIONS = {
    'SUPER_ADMIN': {
        'dashboard:read', 'asset:read', 'asset:write', 'network:read', 'network:write',
        'scan:read', 'scan:write', 'vulnerability:read', 'vulnerability:write',
        'alert:read', 'alert:write', 'incident:read', 'incident:write',
        'report:read', 'report:write', 'audit:read', 'user:read', 'user:write',
        'settings:read', 'settings:write', 'ai:read'
    },
    'ORGANISATION_ADMIN': {
        'dashboard:read', 'asset:read', 'asset:write', 'network:read', 'network:write',
        'scan:read', 'scan:write', 'vulnerability:read', 'vulnerability:write',
        'alert:read', 'alert:write', 'incident:read', 'incident:write',
        'report:read', 'report:write', 'audit:read', 'user:read', 'user:write',
        'settings:read', 'settings:write', 'ai:read'
    },
    'SECURITY_ANALYST': {
        'dashboard:read', 'asset:read', 'network:read', 'scan:read', 'scan:write',
        'vulnerability:read', 'vulnerability:write', 'alert:read', 'alert:write',
        'incident:read', 'incident:write', 'report:read', 'report:write', 'audit:read', 'ai:read'
    },
    'IT_ADMIN': {
        'dashboard:read', 'asset:read', 'asset:write', 'network:read', 'scan:read',
        'vulnerability:read', 'vulnerability:write', 'alert:read', 'incident:read', 'report:read'
    },
    'VIEWER': {
        'dashboard:read', 'asset:read', 'network:read', 'scan:read', 'vulnerability:read', 'alert:read', 'incident:read', 'report:read', 'audit:read', 'ai:read'
    },
}

TOKEN_STORE: dict[str, dict[str, Any]] = {}


def issue_tokens_for_user(user: dict[str, Any]) -> tuple[str, str]:
    access_token = f"demo-access-{uuid.uuid4()}"
    refresh_token = f"demo-refresh-{uuid.uuid4()}"
    issued_at = datetime.now(timezone.utc)
    TOKEN_STORE[access_token] = {
        'id': user['id'],
        'user_id': user['id'],
        'org_id': user['org_id'],
        'role': user['role'],
        'email': user['email'],
        'issued_at': issued_at,
    }
    TOKEN_STORE[refresh_token] = {
        'id': user['id'],
        'user_id': user['id'],
        'org_id': user['org_id'],
        'role': user['role'],
        'email': user['email'],
        'issued_at': issued_at + timedelta(days=7),
    }
    return access_token, refresh_token


def get_current_user(request: Request) -> dict[str, Any]:
    auth_header = request.headers.get('authorization', '')
    if not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing bearer token')
    token = auth_header.split(' ', 1)[1].strip()
    user = TOKEN_STORE.get(token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired token')
    return user


def require_permission(permission: str):
    def dependency(request: Request) -> dict[str, Any]:
        user = get_current_user(request)
        if permission not in ROLE_PERMISSIONS.get(user['role'], set()):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')
        return user

    return dependency
