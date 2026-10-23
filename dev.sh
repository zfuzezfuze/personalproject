cd "$(dirname "$0")"

echo "Starting PostgreSQL..."
docker compose up -d db

echo "Starting frontend..."
cd frontend
python3 -m http.server 5500 &
FRONTEND_PID=$!

# Stop our frontend server when the script exits
cleanup() {
    kill "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "Starting Flask backend..."
cd ../backend/task-service

# Use Python from our virtual environment
.venv/bin/python app.py
