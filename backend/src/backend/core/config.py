from enum import Enum
from pathlib import Path
from typing import ClassVar, List, Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class Settings(BaseSettings):
    # ---------------------------------------------------------
    # Base paths
    # ---------------------------------------------------------
    ROOT: ClassVar[Path] = Path(__file__).resolve().parents[3]

    # ---------------------------------------------------------
    # Application
    # ---------------------------------------------------------

    APP_NAME: str = "LLM Fine-tuning Platform"
    ENVIRONMENT: Environment = Environment.DEVELOPMENT
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-here-change-this-in-production"

    # ---------------------------------------------------------
    # Pipeline and Execution
    # ---------------------------------------------------------

    PIPELINE_WORKERS: int = 4
    PIPELINE_QUEUE_MAX_SIZE: int = 100
    PIPELINE_EXECUTION_TIMEOUT: int = 3600

    # ---------------------------------------------------------
    # Database
    # ---------------------------------------------------------

    DATABASE_URL: str = "sqlite:///./llm_platform.db"

    # ---------------------------------------------------------
    # Redis
    # ---------------------------------------------------------

    REDIS_URL: str = "redis://localhost:6379"

    # ---------------------------------------------------------
    # Spark
    # ---------------------------------------------------------

    SPARK_MASTER: str = "local[*]"
    SPARK_APP_NAME: str = "LLMDataProcessor"

    # ---------------------------------------------------------
    # Configuration paths
    # ---------------------------------------------------------

    CONFIG_PATH: Path = ROOT / "config"

    DEFAULT_SETTINGS_FILE_PATH: Path = (
        CONFIG_PATH / "default_settings.json"
    )

    BACKUP_DIR: Path = CONFIG_PATH / "backups"

    # ---------------------------------------------------------
    # Model / Data Storage
    # ---------------------------------------------------------

    MODEL_STORAGE_PATH: Path = ROOT / "models"
    DATA_STORAGE_PATH: Path = ROOT / "data"
    TEMP_PATH: Path = ROOT / "temp"

    # ---------------------------------------------------------
    # API
    # ---------------------------------------------------------

    API_V1_PREFIX: str = "/api/v1"

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

    # ---------------------------------------------------------
    # MLflow
    # ---------------------------------------------------------

    MLFLOW_TRACKING_URI: str = "./mlruns"

    # ---------------------------------------------------------
    # Model Settings
    # ---------------------------------------------------------

    DEFAULT_MODEL: str = "bert-base-uncased"
    DEFAULT_BATCH_SIZE: int = 16
    DEFAULT_LEARNING_RATE: float = 2e-5
    DEFAULT_EPOCHS: int = 3

    # ---------------------------------------------------------
    # Deployment
    # ---------------------------------------------------------

    DEPLOYMENT_PORT: int = 8080
    DEPLOYMENT_WORKERS: int = 4

    # ---------------------------------------------------------
    # Backup
    # ---------------------------------------------------------

    BACKUP_ENABLED: bool = True
    MAX_BACKUPS: int = 10

    # ---------------------------------------------------------
    # Pydantic Settings
    # ---------------------------------------------------------

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# -------------------------------------------------------------
# Settings instance
# -------------------------------------------------------------

settings = Settings()


# -------------------------------------------------------------
# Directory initialization
# -------------------------------------------------------------

def ensure_directories() -> None:
    """Create required application directories."""

    directories = [
        settings.MODEL_STORAGE_PATH,
        settings.DATA_STORAGE_PATH,
        settings.DATA_STORAGE_PATH / "raw",
        settings.DATA_STORAGE_PATH / "processed",
        settings.DATA_STORAGE_PATH / "uploads",
        settings.MODEL_STORAGE_PATH / "cache",
        settings.CONFIG_PATH,
        settings.BACKUP_DIR,
        settings.TEMP_PATH,
        settings.ROOT / "logs",
        settings.ROOT / "mlruns",
    ]

    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)


ensure_directories()


# -------------------------------------------------------------
# Debug configuration
# -------------------------------------------------------------

if settings.DEBUG:
    print("✓ Configuration loaded successfully")
    print(f"  Environment : {settings.ENVIRONMENT}")
    print(f"  Debug       : {settings.DEBUG}")
    print(f"  Root dir    : {settings.ROOT}")
    print(f"  Config      : {settings.CONFIG_PATH}")
    print(f"  Models      : {settings.MODEL_STORAGE_PATH}")
    print(f"  Data        : {settings.DATA_STORAGE_PATH}")