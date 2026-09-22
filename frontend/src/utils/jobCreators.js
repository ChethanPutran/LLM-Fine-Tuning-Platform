import { apiService } from '../services/api';

/**
 * One creator per stage type. All of them call the `/add` endpoint with
 * `autoExecute: false` — the job is registered but not started.
 */
export const JOB_CREATORS = {
  data_collection: (c) =>
    apiService.createDataCollectionJob({
      source: c.source,
      topic: c.topic,
      limit: c.limit || 100,
      searchEngine: c.searchEngine || 'google',
      config: c,
      autoExecute: false,
    }),

  preprocessing: (c) =>
    apiService.createPreprocessingJob({
      inputPath: c.input_path,
      config: c,
      autoExecute: false,
    }),

  tokenization: (c) =>
    apiService.createTokenizerJob({
      tokenizerType: c.tokenizer_type,
      datasetPath: c.corpus_path,
      vocabSize: c.vocab_size || 32000,
      config: c,
      autoExecute: false,
    }),

  training: (c) =>
    apiService.createTrainingJob({
      modelType: c.model_type,
      modelName: c.model_name,
      datasetPath: c.dataset_path,
      taskType: c.task_type,
      config: c,
      autoExecute: false,
    }),

  finetuning: (c) =>
    apiService.createFinetuningJob({
      modelPath: c.base_model,
      datasetPath: c.dataset,
      taskType: c.task,
      taskCategory: c.task_category,
      strategyType: c.strategy_type || 'lora',
      config: c,
      autoExecute: false,
    }),

  optimization: (c) =>
    apiService.createOptimizationJob({
      modelPath: c.input_model,
      optimizationType: c.optimization_type,
      config: c,
      autoExecute: false,
    }),

  deployment: (c) =>
    apiService.createDeploymentJob({
      modelPath: c.model_path,
      servingFramework: c.serving_framework,
      deploymentTarget: c.deployment_target || 'local',
      config: c,
      autoExecute: false,
    }),
};