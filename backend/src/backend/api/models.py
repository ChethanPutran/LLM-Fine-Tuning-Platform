# backend/api/models.py

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4

from backend.common.job_models import JobPriority
from backend.core.data_collection.config import DataCollectionConfig
from backend.core.datasets.config import DatasetConfig
from backend.core.deployment.config import DeploymentConfig
from backend.core.finetuning.config import FinetuningConfig
from backend.core.models.config import ModelConfig
from backend.core.optimization.config import OptimizationConfig
from backend.core.pipeline_engine.config import PipelineConfig
from backend.core.preprocessing.config import PreprocessingConfig
from backend.core.training.config import TrainingConfig
from backend.core.tokenization.config import TokenizationConfig


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class RequestBase(BaseModel):
    """Base request model with common fields."""
    auto_execute: bool = Field(
        True, description="Automatically execute the job after creation"
    )
    tags: Optional[List[str]] = Field(
        None, description="Optional tags for categorization"
    )
    user_id: str = Field(
        "system", description="User ID who triggered the request"
    )


class StartCollectionRequest(RequestBase):
    config: DataCollectionConfig = Field(
        default_factory=DataCollectionConfig,
        description="Configuration for data collection",
    )


class StartDeploymentRequest(RequestBase):
    config: DeploymentConfig = Field(
        default_factory=DeploymentConfig,
        description="Configuration for deployment",
    )


class StartTrainingRequest(RequestBase):
    dataset_config: DatasetConfig = Field(
        default_factory=DatasetConfig, description="Dataset configuration"
    )
    train_model_config: ModelConfig = Field(
        default_factory=ModelConfig, description="Model configuration"
    )
    config: TrainingConfig = Field(
        default_factory=TrainingConfig, description="Training configuration"
    )


class StartFinetuningRequest(RequestBase):
    job_id: UUID = Field(default_factory=uuid4, description="Job identifier")
    base_model_config: ModelConfig = Field(
        default_factory=ModelConfig, description="Base model configuration"
    )
    dataset_config: DatasetConfig = Field(
        default_factory=DatasetConfig, description="Dataset configuration"
    )
    config: FinetuningConfig = Field(
        default_factory=FinetuningConfig,
        description="Fine-tuning configuration",
    )


class StartOptimizationRequest(RequestBase):
    config: OptimizationConfig = Field(
        default_factory=OptimizationConfig,
        description="Optimization configuration",
    )


class StartPreprocessingRequest(RequestBase):
    config: PreprocessingConfig = Field(
        ..., description="Preprocessing configuration"
    )


class TrainTokenizerRequest(RequestBase):
    config: TokenizationConfig = Field(
        default_factory=TokenizationConfig,
        description="Additional configuration",
    )


class EncodeRequest(RequestBase):
    tokenizer_path: str = Field(..., description="Path to tokenizer")
    text: str = Field(..., description="Text to encode")
    max_length: Optional[int] = Field(
        None, description="Maximum sequence length"
    )


class DecodeRequest(RequestBase):
    tokenizer_path: str = Field(..., description="Path to tokenizer")
    token_ids: List[int] = Field(..., description="Token IDs to decode")


class ExecutePipelineRequest(RequestBase):
    config: PipelineConfig = Field(
        ..., description="Pipeline execution configuration"
    )
    priority: JobPriority = Field(
        JobPriority.NORMAL, description="Execution priority"
    )


class CreatePipelineJobRequest(RequestBase):
    config: PipelineConfig = Field(
        ..., description="Pipeline configuration for job creation"
    )


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class ResponseBase(BaseModel):
    """
    Base response model. `status` has a safe default so any controller
    that omits it (or that returns early with only an error message)
    still satisfies the schema.
    """
    tags: Optional[List[str]] = Field(
        None, description="Optional tags for categorization"
    )
    user_id: Optional[UUID] = Field(
        None, description="User ID who triggered the request"
    )
    status: str = Field(
        default="success",
        description="Current status of the job/request",
    )
    message: Optional[str] = Field(
        default=None, description="Additional information about the job status"
    )
    error: Optional[str] = Field(
        default=None, description="Error message if the job failed"
    )


class JobCreationResponse(ResponseBase):
    """Response model for job creation."""
    job_id: UUID = Field(..., description="Job identifier")
    job_type: Optional[str] = Field(
        None,
        description="Type of the job (e.g., training, data collection)",
    )
    execution_id: Optional[str] = Field(
        None, description="Execution ID if the job was auto-executed"
    )
    node_id: Optional[str] = None
    progress: Optional[float] = Field(
        None, description="Progress percentage of the job"
    )
    result: Optional[Dict[str, Any]] = None


class ExecutionStatusResponse(ResponseBase):
    """Response model for execution status."""
    # Optional: queued executions may not have an id at return time.
    execution_id: Optional[UUID] = Field(
        None, description="Execution identifier (None while queued)"
    )
    job_id: Optional[UUID] = Field(
        None, description="Associated job identifier"
    )
    node_id: Optional[str] = None
    progress: Optional[float] = Field(
        None, description="Progress percentage of the execution"
    )
    optimization: Optional[Dict[str, Any]] = Field(
        None, description="Pipeline optimization summary"
    )
    execution_plan: Optional[List[List[str]]] = Field(
        None, description="Parallel execution plan"
    )
    generated_code_path: Optional[str] = Field(
        None, description="Path to generated Python execution code"
    )
    result: Optional[Dict[str, Any]] = None

    @field_validator("execution_id", "job_id", mode="before")
    @classmethod
    def _coerce_uuid(cls, v):
        """
        Accept UUID, str UUID, empty string, or the literal 'None' / 'null'.
        Everything that isn't a real UUID becomes Python None — this is
        what turns the previous 500 into a clean 200.
        """
        if v is None:
            return None
        if isinstance(v, UUID):
            return v
        s = str(v).strip()
        if s in ("", "None", "null", "none"):
            return None
        try:
            return UUID(s)
        except (ValueError, AttributeError, TypeError):
            return None


class JobStatusResponse(ResponseBase):
    """Response model for a single job's status."""
    job_id: UUID = Field(..., description="Job identifier")
    job_type: Optional[str] = None
    execution_id: Optional[str] = None
    node_id: Optional[str] = None
    progress: Optional[float] = None
    result: Optional[Dict[str, Any]] = None


class ListJobsResponse(ResponseBase):
    """Response model for listing jobs."""
    jobs: List[JobStatusResponse] = Field(
        ..., description="List of jobs matching the criteria"
    )


class StaticResourceResponse(ResponseBase):
    """Response model for static resource requests."""
    resource_id: str = Field(..., description="Identifier for the requested resource")
    url: str = Field(..., description="URL to access the resource")


class StatisticsResponse(ResponseBase):
    """Response model for statistics requests."""
    total_jobs: int = Field(..., description="Total number of jobs")
    completed_jobs: int = Field(..., description="Number of completed jobs")
    failed_jobs: int = Field(..., description="Number of failed jobs")
    in_progress_jobs: int = Field(..., description="Number of jobs in progress")
    cancelled_jobs: int = Field(..., description="Number of cancelled jobs")
    removed_jobs: int = Field(..., description="Number of removed jobs")
    average_duration: Optional[float] = Field(
        None, description="Average duration of completed jobs in seconds"
    )


class MetricResponse(ResponseBase):
    """Response model for metric retrieval."""
    metric_name: str = Field(..., description="Name of the metric")
    value: Any = Field(..., description="Value of the metric")


class LogsResponse(ResponseBase):
    """Response model for logs retrieval."""
    logs: List[str] = Field(..., description="List of log entries")
    tail: int = Field(
        ..., description="Number of log lines returned from the end"
    )


class ListResourcesResponse(ResponseBase):
    """Response model for listing resources."""
    items: List[Dict[str, Any]] = Field(..., description="List of resources")


class PipelineExecutionResponse(ExecutionStatusResponse):
    """Response model for pipeline execution."""
    pass


class Template(ResponseBase):
    """Response model for template retrieval."""
    template_id: str = Field(..., description="Identifier for the retrieved template")
    content: Dict[str, Any] = Field(..., description="Content of the template")
    name: Optional[str] = Field(None, description="Name of the template")
    description: Optional[str] = Field(None, description="Description of the template")
    nodes: Optional[int] = Field(
        None, description="Number of nodes in the pipeline template"
    )


class TemplateListResponse(ResponseBase):
    """Response model for listing pipeline templates."""
    templates: Dict[str, Template] = Field(
        ..., description="List of available pipeline templates"
    )


class FinetuningStatusResponse(ResponseBase):
    """Response model for fine-tuning job status."""
    pass


class FinetuningResponse(ResponseBase):
    """Response model for fine-tuning job response."""
    pass


class ValidationResponse(ResponseBase):
    """Response model for pipeline validation."""
    valid: bool = Field(
        ..., description="Indicates if the pipeline configuration is valid"
    )
    errors: Optional[List[str]] = Field(
        None, description="List of validation errors if the configuration is invalid"
    )
    nodes: Optional[int] = Field(
        None, description="Number of nodes in the pipeline configuration"
    )
    edges: Optional[int] = Field(
        None, description="Number of edges in the pipeline configuration"
    )