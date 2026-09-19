.PHONY: backend frontend test up down

backend:
	cd backend && (if not exist .venv py -3.12 -m venv .venv) && .\.venv\Scripts\python -m pip install -r requirements.txt && .\.venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm install && npm run dev -- --host 0.0.0.0 --port 5173

test:
	cd backend && ..\.venv\Scripts\python -m pytest -q

up:
	docker compose up --build

down:
	docker compose down -v
