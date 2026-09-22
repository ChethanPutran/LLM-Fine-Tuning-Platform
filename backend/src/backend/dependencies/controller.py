# app/dependencies/controller.py

from fastapi import Depends
from backend.core.pipeline_engine.orchestrator import PipelineOrchestrator
from backend.controllers.data_collection_controller import DataCollectionController
from backend.controllers.preprocessing_controller import PreprocessingController
from backend.controllers.training_controller import TrainingController
from backend.controllers.optimization_controller import OptimizationController
from backend.controllers.deployment_controller import DeploymentController
from backend.controllers.tokenization_controller import TokenizationController
from backend.controllers.pipeline_controller import PipelineController
from backend.controllers.settings_controller import SettingsController
from backend.controllers.general_controller import GeneralController


# Global orchestrator instance
_orchestrator = None


def get_orchestrator() -> PipelineOrchestrator:
    """Get or create orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PipelineOrchestrator(num_workers=4)
    return _orchestrator


async def get_settings_controller(
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
) -> SettingsController:
    """Get settings controller instance"""
    return SettingsController(orchestrator)

async def get_general_controller(
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
) -> GeneralController:
    """Get general controller instance"""
    return GeneralController(orchestrator)

def get_data_collection_controller(
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
) -> DataCollectionController:
    """Get data collection controller instance"""
    return DataCollectionController(orchestrator)


def get_preprocessing_controller(
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
) -> PreprocessingController:
    """Get preprocessing controller instance"""
    return PreprocessingController(orchestrator)


def get_training_controller(
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
) -> TrainingController:
    """Get training controller instance"""
    return TrainingController(orchestrator)


async def get_pipeline_controller(
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
) -> PipelineController:
    """Get pipeline controller instance"""
    return PipelineController(orchestrator)

def get_optimization_controller(
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
) -> OptimizationController:
    """Get optimization controller instance"""
    return OptimizationController(orchestrator)


def get_deployment_controller(
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
) -> DeploymentController:
    """Get deployment controller instance"""
    return DeploymentController(orchestrator)


def get_tokenization_controller(
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator)
) -> TokenizationController:
    """Get tokenization controller instance"""
    return TokenizationController(orchestrator)