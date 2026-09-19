import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]

for env_file in (PROJECT_ROOT / '.env', BACKEND_ROOT / '.env'):
    if env_file.exists():
        load_dotenv(env_file, override=False)

PROJECT_ROOT = BACKEND_ROOT

APP_NAME = os.getenv('APP_NAME', 'CyberShield 360')
APP_ENV = os.getenv('APP_ENV', 'development')
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-me')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', '120'))
JWT_REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRE_DAYS', '7'))
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./cybershield.db')
SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip()
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '').strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip()
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET', '').strip()
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
DEMO_MODE = os.getenv('DEMO_MODE', 'true').lower() == 'true'
USE_SUPABASE = bool(SUPABASE_URL) and bool(SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)

CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if origin.strip()]
