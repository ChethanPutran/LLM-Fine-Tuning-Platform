# backend/common/job_models.py

from enum import Enum
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from uuid import UUID, uuid4
from pydantic import BaseModel, Field

from .enums import NodeType, JobType, JobStatus, JobPriority
from ..config.config_provider import (
    PipelineConfig,
    DataCollectionConfig,
    PreprocessingConfig,
    TokenizationConfig,
    TrainingConfig,
    FinetuningConfig,
    OptimizationConfig,
    DeploymentConfig,
    EvaluationConfig,
    ModelConfig,
    DatasetConfig,
)


def _utcnow() -> datetime:
    """Single source of truth for timestamps. Always aware, always UTC."""
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Base job
# ---------------------------------------------------------------------------

class BaseJob(BaseModel):
    """Base job class with common functionality."""

    job_id: UUID = Field(default_factory=uuid4)
    job_type: JobType = Field(JobType.DATA_PROCESSING)
    status: JobStatus = Field(JobStatus.PENDING)
    priority: JobPriority = Field(JobPriority.NORMAL)
    progress: float = Field(0.0)

    # All timestamps are aware UTC — consistent across naive/aware callers
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    started_at: Optional[datetime] = Field(None)
    completed_at: Optional[datetime] = Field(None)

    # Identity / linkage
    execution_id: Optional[UUID] = Field(None)
    pipeline_id: Optional[UUID] = Field(None)
    node_id: Optional[str] = Field(None)
    user_id: Optional[str] = Field(None)

    # Result & error
    result: Optional[Dict[str, Any]] = Field(None)
    error: Optional[str] = Field(None)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    metrics: Dict[str, Any] = Field(default_factory=dict)

    # Retry policy
    retry_count: int = Field(0)
    max_retries: int = Field(3)
    retry_policy: Dict[str, Any] = Field(
        default_factory=lambda: {"retries": 3, "delay_seconds": 5}
    )

    tags: List[str] = Field(default_factory=list)

    # ---------------- Mutators ----------------

    def update_progress(self, progress: float) -> None:
        """Update job progress (0.0 to 100.0)."""
        self.progress = max(0.0, min(100.0, progress))
        self.updated_at = _utcnow()

    def mark_started(self) -> None:
        self.status = JobStatus.RUNNING
        self.started_at = _utcnow()
        self.updated_at = _utcnow()

    def mark_completed(self, result: Dict[str, Any]) -> None:
        self.status = JobStatus.COMPLETED
        self.completed_at = _utcnow()
        self.updated_at = _utcnow()
        self.result = result
        self.progress = 100.0

    def mark_failed(self, error: str) -> None:
        self.status = JobStatus.FAILED
        self.error = error
        self.completed_at = _utcnow()
        self.updated_at = _utcnow()

    def mark_cancelled(self) -> None:
        self.status = JobStatus.CANCELLED
        self.completed_at = _utcnow()
        self.updated_at = _utcnow()

    def mark_removed(self) -> None:
        self.status = JobStatus.REMOVED
        self.completed_at = _utcnow()
        self.updated_at = _utcnow()

    def increment_retry(self) -> None:
        self.retry_count += 1
        if self.retry_count >= self.max_retries:
            self.status = JobStatus.FAILED
        else:
            self.status = JobStatus.RETRYING
        self.updated_at = _utcnow()


# ---------------------------------------------------------------------------
# Concrete jobs
# ---------------------------------------------------------------------------

class PipelineJob(BaseJob):
    """Pipeline job that can contain multiple sub-jobs."""
    job_type: JobType = JobType.INFERENCE   # consider adding JobType.PIPELINE
    config: PipelineConfig = Field(default_factory=PipelineConfig)


class DataCollectionJob(BaseJob):
    job_type: JobType = JobType.DATA_COLLECTION
    config: DataCollectionConfig = Field(default_factory=DataCollectionConfig)


class PreprocessingJob(BaseJob):
    job_type: JobType = JobType.DATA_PROCESSING
    config: PreprocessingConfig = Field(default_factory=PreprocessingConfig)


class TokenizationJob(BaseJob):
    job_type: JobType = JobType.TOKENIZATION
    config: TokenizationConfig = Field(default_factory=TokenizationConfig)


class TrainingJob(BaseJob):
    job_type: JobType = JobType.TRAINING
    train_model_config: ModelConfig = Field(
        default_factory=lambda: ModelConfig(model_name="", tokenizer="")
    )
    dataset_config: DatasetConfig = Field(default_factory=DatasetConfig)
    config: TrainingConfig = Field(default_factory=TrainingConfig)


class FinetuningJob(BaseJob):
    job_type: JobType = JobType.FINETUNING
    config: FinetuningConfig = Field(default_factory=FinetuningConfig)
    base_model_config: ModelConfig = Field(
        default_factory=lambda: ModelConfig(model_name="", tokenizer="")
    )
    dataset_config: DatasetConfig = Field(default_factory=DatasetConfig)


class OptimizationJob(BaseJob):
    job_type: JobType = JobType.OPTIMIZATION
    config: OptimizationConfig = Field(default_factory=OptimizationConfig)


class DeploymentJob(BaseJob):
    job_type: JobType = JobType.DEPLOYMENT
    config: DeploymentConfig = Field(default_factory=DeploymentConfig)


class EvaluationJob(BaseJob):
    job_type: JobType = JobType.EVALUATION
    config: EvaluationConfig = Field(default_factory=EvaluationConfig)


# ---------------------------------------------------------------------------
# Priority mapping
# ---------------------------------------------------------------------------

PRIORITY_MAP = {
    JobType.DATA_COLLECTION: JobPriority.CRITICAL,
    JobType.DATA_PROCESSING: JobPriority.HIGH,
    JobType.TRAINING: JobPriority.HIGH,
    JobType.FINETUNING: JobPriority.NORMAL,
    JobType.OPTIMIZATION: JobPriority.NORMAL,
    JobType.DEPLOYMENT: JobPriority.LOW,
    JobType.EVALUATION: JobPriority.NORMAL,
    JobType.TOKENIZATION: JobPriority.LOW,
    JobType.INFERENCE: JobPriority.BACKGROUND,
}


# ---------------------------------------------------------------------------
# Job factory
# ---------------------------------------------------------------------------

_RESOURCE_MAP: Dict[JobType, Dict[str, Any]] = {
    JobType.DATA_COLLECTION: {"cpu": 2, "memory": "4GB"},
    JobType.DATA_PROCESSING: {"cpu": 4, "memory": "8GB"},
    JobType.TRAINING: {"gpu": 1, "cpu": 8, "memory": "32GB"},
    JobType.FINETUNING: {"gpu": 1, "cpu": 4, "memory": "16GB"},
    JobType.OPTIMIZATION: {"gpu": 1, "cpu": 4, "memory": "16GB"},
    JobType.DEPLOYMENT: {"cpu": 2, "memory": "4GB"},
    JobType.EVALUATION: {"gpu": 1, "cpu": 4, "memory": "16GB"},
    JobType.TOKENIZATION: {"cpu": 4, "memory": "8GB"},
    JobType.INFERENCE: {"gpu": 1, "cpu": 4, "memory": "16GB"},
}


class JobFactory:
    """Factory for creating different types of jobs."""

    # ---------------- Metadata ----------------

    @staticmethod
    def create_job_metadata(
        name: str,
        node_type: NodeType,
        job: BaseJob,
        description: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate job metadata.

        `config` was previously a mutable default `{}` — replaced with
        Optional[...] = None so we never share state between calls.
        """
        config = config or {}

        return {
            "name": name,
            "node_type": node_type,
            "retry_policy": config.get(
                "retry_policy", {"retries": 3, "delay_seconds": 5}
            ),
            "position": config.get("position", (0, 0)),
            "description": description or "",
            "tags": tags or [],
            # Resources now come from the job's own type, not a hardcoded one.
            "resources": JobFactory.get_required_job_resource(job.job_type),
            "metadata": config.get("metadata", {}),
        }

    @staticmethod
    def get_required_job_resource(job_type: JobType) -> Dict[str, Any]:
        """Get required resources for a given job type."""
        return _RESOURCE_MAP.get(job_type, {"cpu": 2, "memory": "4GB"})

    # ---------------- Job creators ----------------

    @staticmethod
    def create_data_collection_job(
        data_collection_config: DataCollectionConfig,
        **kwargs,
    ) -> DataCollectionJob:
        return DataCollectionJob(
            config=data_collection_config,
            priority=PRIORITY_MAP.get(JobType.DATA_COLLECTION, JobPriority.NORMAL),
            **kwargs,
        )

    @staticmethod
    def create_preprocessing_job(
        preprocessing_config: Optional[PreprocessingConfig] = None,
        **kwargs,
    ) -> PreprocessingJob:
        # Field(...) is a Pydantic construct, not a Python function default.
        if preprocessing_config is None:
            preprocessing_config = PreprocessingConfig()

        return PreprocessingJob(
            config=preprocessing_config,
            priority=PRIORITY_MAP.get(JobType.DATA_PROCESSING, JobPriority.NORMAL),
            **kwargs,
        )

    @staticmethod
    def create_training_job(
        training_config: TrainingConfig,
        model_config: ModelConfig,
        dataset_config: DatasetConfig,
        **kwargs,
    ) -> TrainingJob:
        return TrainingJob(
            train_model_config=model_config,
            dataset_config=dataset_config,
            config=training_config,
            priority=PRIORITY_MAP.get(JobType.TRAINING, JobPriority.NORMAL),
            **kwargs,
        )

    @staticmethod
    def create_finetuning_job(
        finetune_config: FinetuningConfig,
        base_model_config: ModelConfig,
        dataset_config: DatasetConfig,
        **kwargs,
    ) -> FinetuningJob:
        return FinetuningJob(
            config=finetune_config,
            base_model_config=base_model_config,
            dataset_config=dataset_config,
            priority=PRIORITY_MAP.get(JobType.FINETUNING, JobPriority.NORMAL),
            **kwargs,
        )

    @staticmethod
    def create_optimization_job(
        optimization_config: OptimizationConfig,
        **kwargs,
    ) -> OptimizationJob:
        return OptimizationJob(
            config=optimization_config,
            priority=PRIORITY_MAP.get(JobType.OPTIMIZATION, JobPriority.NORMAL),
            **kwargs,
        )

    @staticmethod
    def create_deployment_job(
        deployment_config: DeploymentConfig,
        **kwargs,
    ) -> DeploymentJob:
        return DeploymentJob(
            config=deployment_config,
            priority=PRIORITY_MAP.get(JobType.DEPLOYMENT, JobPriority.NORMAL),
            **kwargs,
        )

    @staticmethod
    def create_tokenization_job(
        tokenization_config: TokenizationConfig,
        **kwargs,
    ) -> TokenizationJob:
        return TokenizationJob(
            config=tokenization_config,
            priority=PRIORITY_MAP.get(JobType.TOKENIZATION, JobPriority.NORMAL),
            **kwargs,
        )

    @staticmethod
    def create_evaluation_job(
        evaluation_config: EvaluationConfig,
        **kwargs,
    ) -> EvaluationJob:
        return EvaluationJob(
            config=evaluation_config,
            priority=PRIORITY_MAP.get(JobType.EVALUATION, JobPriority.NORMAL),
            **kwargs,
        )

    @staticmethod
    def create_pipeline_job(
        pipeline_config: PipelineConfig,
        **kwargs,
    ) -> PipelineJob:
        return PipelineJob(
            config=pipeline_config,
            priority=PRIORITY_MAP.get(JobType.INFERENCE, JobPriority.BACKGROUND),
            **kwargs,
        )