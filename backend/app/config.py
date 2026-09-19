import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / '.env')

PROJECT_ROOT = Path(__file__).resolve().parent.parent

APP_NAME = os.getenv('APP_NAME', 'CyberShield 360')
APP_ENV = os.getenv('APP_ENV', 'development')
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-me')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', '120'))
JWT_REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRE_DAYS', '7'))
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./cybershield.db')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
DEMO_MODE = os.getenv('DEMO_MODE', 'true').lower() == 'true'

CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if origin.strip()]
