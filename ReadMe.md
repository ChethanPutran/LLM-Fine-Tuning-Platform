# LLM Fine-Tuning Platform

A full-stack, web-based platform for building, executing, and monitoring end-to-end
LLM fine-tuning pipelines. Define a pipeline as a visual DAG of stages — from data
collection through preprocessing, tokenization, training, fine-tuning, optimization,
and deployment — and run it with live progress over WebSockets.

---

## Overview

Fine-tuning a large language model involves many steps: gathering data, cleaning it,
tokenizing it, training, applying parameter-efficient fine-tuning (PEFT), compressing
the model, and serving it. This project wraps that entire lifecycle into a single
modular system with:

- A **React frontend** with a drag-and-drop pipeline builder (React Flow), live
  execution monitoring, job history, logs, and statistics.
- A **FastAPI backend** that orchestrates pipeline stages asynchronously with a
  DAG-based engine: validation, scheduling, retries, checkpointing, and state
  management.
- A plugin-style **strategy/handler architecture** so new models, tokenizers,
  fine-tuning methods, optimizers, and serving frameworks can be added without
  touching existing code.

---

## Key Features

### Pipeline Builder (Frontend)
- Seven composable stage types, wired as a visual DAG with React Flow:
  `Data Collection → Preprocessing → Tokenization → Training → Fine-tuning → Optimization → Deployment`
- Each stage declares the **artifacts it produces and consumes** (raw data, clean
  data, tokenizer, model, fine-tuned model, optimized model, endpoint), and the UI
  enforces valid connections between them.
- Per-stage configuration forms (basic + advanced fields), pipeline save/load,
  execution history, live logs, and statistics dashboards (Recharts).

### Backend Orchestration
- DAG validation, topological scheduling, and execution (`pipeline_engine/`).
- Async job execution with a worker pool, job queue, and resource manager
  (`execution/`).
- Retry policies with backoff, pipeline state persistence, and artifact resolution
  between stages.
- An alternative **shared-memory orchestration** mode (`docker-compose.shared-memory.yml`)
  for coordinated multi-process runs.
- Real-time progress, metrics, and logs streamed to the UI over WebSockets.

### Fine-Tuning & Models
- **PEFT strategies**: LoRA, Prefix Tuning, Adapter Tuning, and full fine-tuning
  (via Hugging Face `peft`).
- **Task types**: classification, summarization, question answering, text generation
  (plus image captioning in training tasks).
- **Model zoo**: BERT, BART, GPT-style, ViT, and VLM model wrappers with a factory.
- **Tokenizers**: BPE, WordPiece, and SentencePiece, each with a common base class
  and factory.

### Optimization & Deployment
- Model compression: **pruning**, **quantization**, and **knowledge distillation**.
- Serving: **TorchServe**, **TensorFlow Serving**, and **ONNX Runtime** backends.
- Evaluation module for quality metrics (e.g., ROUGE) on generation outputs.

### Data Layer
- Data collection via **web scraping** (generic web scraper + book scraper) or file
  upload, with a factory pattern for adding sources.
- **PySpark-based preprocessing**: text cleaning/normalization, deduplication, and
  knowledge extraction, scalable through a Spark master/worker setup.
- Retrieval-Augmented Generation (RAG) prototype using **FAISS** dense vector search
  with sentence-transformers embeddings.

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, Vite 8, Material UI 6, React Flow 11, Recharts, socket.io-client |
| Backend    | Python 3.12+, FastAPI, Uvicorn, Pydantic v2, WebSockets |
| ML/NLP     | peft, datasets, tokenizers, sentencepiece, sentence-transformers, faiss-cpu, rouge-score, scikit-learn |
| Processing | PySpark, pandas, NumPy, BeautifulSoup4, aiohttp |
| Serving    | ONNX Runtime, TorchServe, TensorFlow Serving |
| Infra      | PostgreSQL (SQLAlchemy/asyncpg/Alembic), Redis, Celery, Docker, Docker Compose |
| Tracking   | MLflow (experiment tracking hooks) |
| Testing    | pytest, pytest-asyncio |

---

## Project Structure

```
├── backend/
│   ├── src/backend/
│   │   ├── main.py                 # FastAPI app entrypoint (lifespan, routers, middleware)
│   │   ├── api/
│   │   │   ├── routes/             # REST endpoints: data_collection, preprocessing,
│   │   │   │                       # tokenization, training, finetuning, optimization,
│   │   │   │                       # deployment, pipeline, settings, general
│   │   │   └── websocket.py        # WebSocket manager for live job/pipeline updates
│   │   ├── controllers/            # Request-handling layer per domain
│   │   ├── core/
│   │   │   ├── data_collection/    # Web/book scrapers + factory
│   │   │   ├── datasets/           # Dataset loading abstraction
│   │   │   ├── preprocessing/      # Spark cleaning, dedup, knowledge extraction
│   │   │   ├── tokenization/       # BPE / WordPiece / SentencePiece + factory
│   │   │   ├── models/             # BERT / BART / GPT / ViT / VLM wrappers + factory
│   │   │   ├── finetuning/         # PEFT strategies (LoRA, prefix, adapter, full) + tasks
│   │   │   ├── training/           # Trainer loop, metrics, per-task trainers
│   │   │   ├── optimization/       # Pruning, quantization, distillation + factory
│   │   │   ├── evaluation/         # Quality metric computation
│   │   │   ├── rag/                # FAISS-based retrieval-augmented generation
│   │   │   ├── deployment/         # TorchServe / TF-Serving / ONNX pipelines + factory
│   │   │   ├── pipeline_engine/    # DAG builder/validator, orchestrator, executor,
│   │   │   │                       # scheduler, retries, state, handlers per stage
│   │   │   ├── execution/          # Async executor, job queue, workers, resource manager
│   │   │   ├── shared_memory_orchestration/  # Alternative multi-process orchestration
│   │   │   └── config.py, exceptions.py, logging_config.py
│   │   ├── config/                 # Settings provider + JSON settings/backups
│   │   ├── dependencies/           # FastAPI dependency injection wiring
│   │   ├── utils/                  # Validators, helpers, artifact reference utils
│   │   └── old/                    # Legacy experiments (classical NLP, scratch
│   │                               # transformer/attention, word2vec, notebooks)
│   ├── data/                       # raw/processed data, generated pipeline scripts
│   ├── tests/                      # pytest suite (execution, pipeline_engine)
│   ├── Dockerfile
│   ├── docker-compose.yml          # backend + frontend + postgres + redis + spark
│   ├── docker-compose.shared-memory.yml
│   ├── pyproject.toml              # uv-managed dependencies (Python 3.12+)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard/          # Pipeline builder, execution monitor, history, logs
│   │   │   └── Settings/           # General/Data/Models/Processing/Deployment/
│   │   │                           # Integrations/Security/UI/Advanced tabs
│   │   ├── components/, hooks/, context/, services/, utils/, constants/
│   │   └── App.jsx, main.jsx
│   ├── Dockerfile                  # Nginx-served production build
│   └── package.json
├── scripts/
│   ├── start_backend.sh            # uv-based backend launcher
│   └── start_frontend.sh           # Node 24-based frontend launcher
├── docs/
└── data/
```

---

## Quick Start

### Prerequisites
- **Python 3.12+** with [uv](https://docs.astral.sh/uv/) (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Node.js 24+** and npm
- (Optional) Docker + Docker Compose for the full stack

### Backend (port 8000)

```bash
./scripts/start_backend.sh
```

The script creates the uv virtualenv (`uv sync`), sets `PYTHONPATH`, creates
`data/` and `models/cache/` directories, and runs Uvicorn with reload:

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Or manually:

```bash
cd backend
uv sync
export PYTHONPATH=$PWD
uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (port 3000)

```bash
./scripts/start_frontend.sh
```

The script checks Node 24+, installs dependencies if needed, creates a `.env`
pointing at the backend (`REACT_APP_API_URL=http://localhost:8000/api/v1`,
`REACT_APP_WS_URL=ws://localhost:8000/ws`), and starts Vite:

- UI: http://localhost:3000

Or manually:

```bash
cd frontend
npm install
npm run dev
```

### Full stack with Docker

```bash
docker-compose up --build
```

This starts the backend, frontend (Nginx), PostgreSQL, Redis, and a Spark
master/worker cluster.

---

## How a Pipeline Runs

1. **Build** — In the Dashboard, add stages and connect them into a DAG. The UI
   enforces artifact compatibility (e.g., *Training* requires `clean_data`; the
   *Fine-tuning* stage accepts a `model` or `finetuned_model` as its base).
2. **Validate & schedule** — The backend's `pipeline_engine` validates the DAG,
   topologically sorts the stages, and hands jobs to the execution engine.
3. **Execute** — Workers run each stage via dedicated handlers
   (`handlers/data_collection_handler.py`, `finetuning_handler.py`, etc.).
   Failures are retried with configurable backoff; state is checkpointed so runs
   can be inspected and resumed.
4. **Stream** — Progress, logs, and metrics are pushed over WebSockets to the
   execution monitor in real time.
5. **Deploy** — The final artifact is packaged for TorchServe, TensorFlow
   Serving, or ONNX Runtime and exposed as a serving endpoint.

---

## API Surface

All REST routes are mounted under `/api/v1` (see `backend/src/backend/main.py`):

| Router | Purpose |
|--------|---------|
| `/data-collection` | Create/track scraping & upload jobs |
| `/preprocessing` | Spark cleaning/dedup jobs |
| `/tokenization` | Train/run BPE, WordPiece, SentencePiece tokenizers |
| `/training` | Base-model training jobs |
| `/finetuning` | PEFT fine-tuning jobs (LoRA, prefix, adapter, full) |
| `/optimization` | Pruning / quantization / distillation jobs |
| `/deployment` | Package & serve models (TorchServe / TF-Serving / ONNX) |
| `/pipeline` | Full-DAG pipeline runs |
| `/settings` | Platform configuration (with backup/restore) |
| `/general` | Stats, health, and misc endpoints |

WebSocket endpoint: `/ws` — live job/pipeline events.

Interactive API docs are available at `/docs` when `DEBUG=true`.

---

## Configuration

- Backend settings live in `backend/config/settings.json` (defaults in
  `default_settings.json`), managed through the Settings page and the
  `/settings` API, with automatic JSON backups under `config/backups/`.
- Key environment variables: `ENVIRONMENT`, `DEBUG`, `DATABASE_URL`, `REDIS_URL`,
  `SPARK_MASTER`, `CORS_ORIGINS`, `PIPELINE_WORKERS`.
- Frontend environment: `frontend/.env` (`REACT_APP_API_URL`, `REACT_APP_WS_URL`).

---

## Testing

```bash
cd backend
uv run pytest
```

Test suites live under `backend/tests/` (execution engine, pipeline engine).

---

## Design Notes

The codebase follows SOLID principles and common design patterns (see
`backend/info.txt`):

- **Strategy** — scheduling algorithms, retry strategies, storage backends, PEFT
  methods, tokenizers, optimizers, deployment targets.
- **Factory** — models, tokenizers, scrapers, tasks, optimizers, deployment
  backends.
- **Command / State** — jobs are executed as commands; pipeline and job states
  are managed through explicit state machines.
- **Observer** — event handling in the executor; WebSocket broadcasting of job
  events.
- **Facade / Singleton** — `AsyncExecutor` wraps the subsystem; queue, resource
  manager, and coordinator are singletons.

---

## Notes & Known Gaps

- `requirements.txt` and `pyproject.toml` are not fully in sync: heavy ML deps
  (`torch`, `transformers`, `onnx`, `mlflow`) are commented out in
  `requirements.txt` but present in `pyproject.toml` — use **uv/pypyroject** as
  the source of truth.
- `backend/src/backend/old/` contains legacy experiments (classical NLP,
  from-scratch attention/transformer, word2vec, notebooks) kept for reference —
  it is not part of the active platform.
- `backend/data/generated_pipelines/` holds auto-generated pipeline scripts from
  past runs; `backend/data/raw|processed` holds sample run data.
- `docs/DEPLOYMENT.md` and `docs/USER_GUIDE.md` are placeholders (empty);
  `docs/INFO.md` contains additional platform notes.

---

## Roadmap Ideas

- Re-enable and pin `torch`/`transformers` in the dependency set; add GPU
  training tests in CI.
- Persist pipeline runs in PostgreSQL (schema hooks via SQLAlchemy/Alembic are
  already stubbed in `main.py`).
- vLLM-based serving backend with continuous batching.
- RLHF (DPO/PPO) fine-tuning stage.

---

## License

No license file is currently included — add one before distributing.
