#!/bin/bash

set -e

# ============================================================
# Backend Startup Script
# ============================================================

echo "Starting LLM Fine-tuning Platform Backend..."

# ------------------------------------------------------------
# Resolve project root
# ------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "Project root : $PROJECT_ROOT"
echo "Backend dir  : $BACKEND_DIR"

# ------------------------------------------------------------
# Validate backend directory
# ------------------------------------------------------------

if [ ! -d "$BACKEND_DIR" ]; then
    echo "ERROR: Backend directory not found:"
    echo "$BACKEND_DIR"
    exit 1
fi

cd "$PROJECT_ROOT"

# ------------------------------------------------------------
# Check uv
# ------------------------------------------------------------

if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not installed."
    echo "Install uv first:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo "uv version: $(uv --version)"

# ------------------------------------------------------------
# Environment variables
# ------------------------------------------------------------

export ENVIRONMENT=development
export DEBUG=true

# Spark configuration
export SPARK_LOCAL_IP=127.0.0.1
export PYSPARK_SUBMIT_ARGS="--conf spark.ui.showConsoleProgress=false pyspark-shell"

# Python path
export PYTHONPATH="$BACKEND_DIR${PYTHONPATH:+:$PYTHONPATH}"

# Spark configuration directory
export SPARK_CONF_DIR="$BACKEND_DIR"

# ------------------------------------------------------------
# Create required directories
# ------------------------------------------------------------

echo "Creating required directories..."

mkdir -p \
    "$PROJECT_ROOT/data/raw" \
    "$PROJECT_ROOT/data/processed" \
    "$PROJECT_ROOT/data/uploads" \
    "$PROJECT_ROOT/models/cache" \
    "$PROJECT_ROOT/logs"

# ------------------------------------------------------------
# Check backend Python environment
# ------------------------------------------------------------

if [ ! -d "$BACKEND_DIR/.venv" ]; then
    echo "Backend virtual environment not found."
    echo "Creating backend environment with uv..."

    cd "$BACKEND_DIR"
    uv sync
else
    echo "Backend virtual environment found."
fi

# ------------------------------------------------------------
# Start backend
# ------------------------------------------------------------

cd "$BACKEND_DIR"

echo ""
echo "Starting FastAPI backend..."
echo "API      : http://localhost:8000"
echo "Swagger  : http://localhost:8000/docs"
echo "ReDoc    : http://localhost:8000/redoc"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uv run uvicorn backend.main:app \
    --reload \
    --host 0.0.0.0 \
    --port 8000 \
    --log-level info