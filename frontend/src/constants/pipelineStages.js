import { apiService } from "../services/api.jsx";

export const STAGE_TYPES = {
  DATA_COLLECTION: "data_collection",
  PREPROCESSING: "preprocessing",
  TOKENIZATION: "tokenization",
  TRAINING: "training",
  FINETUNING: "finetuning",
  OPTIMIZATION: "optimization",
  DEPLOYMENT: "deployment",
};

export const STAGE_DEFINITIONS = [
  /* ------------------------------------------------------------------ */
  {
    id: STAGE_TYPES.DATA_COLLECTION,
    name: "Data Collection",
    color: "#2563eb",
    startApi: apiService.createDataCollectionJob.bind(apiService),
    statusApi: apiService.getDataCollectionStatus.bind(apiService),
    // What this stage writes out. The key is the field name in the job's
    // result payload where the backend stores the produced path/URI.
    produces: [
      { kind: "raw_data", key: "output_path", label: "Raw Data" },
    ],
    fields: [
      { key: "source", label: "Data Source", type: "select",
        options: ["web", "books", "upload"], default: "web", required: true },
      { key: "topic", label: "Topic", type: "text",
        placeholder: "e.g., machine learning", required: true },
      { key: "limit", label: "Documents Limit", type: "select",
        options: ["50", "100", "500", "1000"], default: "100" },
    ],
    advancedFields: [
      { key: "max_depth", label: "Max Crawl Depth", type: "number",
        min: 1, max: 5, default: 2 },
      { key: "timeout", label: "Timeout (seconds)", type: "number",
        min: 5, max: 60, default: 10 },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: STAGE_TYPES.PREPROCESSING,
    name: "Preprocessing",
    color: "#7c3aed",
    startApi: apiService.createPreprocessingJob.bind(apiService),
    statusApi: apiService.getPreprocessingStatus.bind(apiService),
    produces: [
      { kind: "clean_data", key: "output_path", label: "Preprocessed Data" },
    ],
    fields: [
      { key: "input_path", label: "Input Data", type: "artifact",
        accept: ["raw_data"], required: true },
      { key: "clean_method", label: "Cleaning Method", type: "select",
        options: ["standard", "advanced"], default: "standard" },
      { key: "output_format", label: "Output Format", type: "select",
        options: ["parquet", "csv", "json"], default: "parquet" },
    ],
    advancedFields: [
      { key: "dedup_threshold", label: "Deduplication Threshold",
        type: "slider", min: 0, max: 1, step: 0.05, default: 0.9 },
      { key: "extract_entities", label: "Extract Named Entities",
        type: "boolean", default: true },
      { key: "normalize_text", label: "Normalize Text",
        type: "boolean", default: true },
      { key: "min_doc_length", label: "Minimum Document Length",
        type: "number", min: 10, max: 500, default: 50 },
      { key: "remove_stopwords", label: "Remove Stopwords",
        type: "boolean", default: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: STAGE_TYPES.TOKENIZATION,
    name: "Tokenization",
    color: "#0ea5e9",
    startApi: apiService.createTokenizerJob.bind(apiService),
    statusApi: apiService.getTokenizerStatus.bind(apiService),
    produces: [
      { kind: "tokenizer", key: "output_path", label: "Tokenizer" },
    ],
    fields: [
      { key: "tokenizer_type", label: "Tokenizer Type", type: "select",
        options: ["bpe", "wordpiece", "sentencepiece"], default: "bpe" },
      { key: "vocab_size", label: "Vocabulary Size", type: "select",
        options: ["30000", "50000", "100000"], default: "50000" },
      // Tokenization works on clean OR raw data.
      { key: "corpus_path", label: "Corpus", type: "artifact",
        accept: ["clean_data", "raw_data"], required: true },
    ],
    advancedFields: [
      { key: "output_path", label: "Output Path", type: "text",
        placeholder: "e.g., /path/to/save/tokenizer", required: true },
      { key: "field", label: "Field to Tokenize", type: "text",
        default: "content_clean" },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: STAGE_TYPES.TRAINING,
    name: "Training",
    color: "#ea580c",
    startApi: apiService.createTrainingJob.bind(apiService),
    statusApi: apiService.getTrainingStatus.bind(apiService),
    produces: [
      { kind: "model", key: "model_path", label: "Trained Model" },
    ],
    fields: [
      { key: "model_type", label: "Model Type", type: "select",
        options: ["bert", "bart", "gpt", "vit", "vlm"],
        default: "bert", required: true },
      { key: "model_name", label: "Model Name", type: "text",
        placeholder: "e.g., bert-base-uncased", required: true },
      { key: "dataset_path", label: "Training Dataset", type: "artifact",
        accept: ["clean_data"], required: true },
    ],
    advancedFields: [
      { key: "task_type", label: "Task", type: "select",
        options: ["classification", "summarization", "qa", "generation"],
        default: "classification" },
      { key: "learning_rate", label: "Learning Rate", type: "number",
        step: 0.00001, default: 0.00002 },
      { key: "num_epochs", label: "Epochs", type: "number",
        min: 1, max: 20, default: 3 },
      { key: "batch_size", label: "Batch Size", type: "select",
        options: ["8", "16", "32", "64"], default: "16" },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: STAGE_TYPES.FINETUNING,
    name: "Fine-tuning",
    color: "#db2777",
    startApi: apiService.createFinetuningJob.bind(apiService),
    statusApi: apiService.getFinetuningStatus.bind(apiService),
    produces: [
      { kind: "finetuned_model", key: "model_path", label: "Fine-tuned Model" },
    ],
    fields: [
      // Base model now comes from an upstream stage.
      { key: "base_model", label: "Base Model", type: "artifact",
        accept: ["model", "finetuned_model"], required: true },
      { key: "task_category", label: "Task Category", type: "select",
        fetch_endpoint: () => apiService.getTaskCategories() },
      { key: "task", label: "Task", type: "select",
        dependsOn: "task_category",
        fetch_endpoint: (c) => apiService.getTasksByCategory(c.task_category) },
      { key: "dataset", label: "Dataset", type: "artifact",
        accept: ["clean_data"], required: true },
    ],
    advancedFields: [
      { key: "learning_rate", label: "Learning Rate", type: "number",
        step: 0.00001, default: 0.00002 },
      { key: "num_epochs", label: "Epochs", type: "number",
        min: 1, max: 20, default: 3 },
      { key: "batch_size", label: "Batch Size", type: "select",
        options: ["8", "16", "32", "64"], default: "16" },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: STAGE_TYPES.OPTIMIZATION,
    name: "Optimization",
    color: "#f59e0b",
    startApi: apiService.createOptimizationJob.bind(apiService),
    statusApi: apiService.getOptimizationStatus.bind(apiService),
    produces: [
      { kind: "optimized_model", key: "model_path", label: "Optimized Model" },
    ],
    fields: [
      { key: "input_model", label: "Model to Optimize", type: "artifact",
        accept: ["model", "finetuned_model"], required: true },
      { key: "optimization_type", label: "Optimization Type", type: "select",
        options: ["pruning", "distillation", "quantization"],
        default: "pruning" },
    ],
    advancedFields: [
      { key: "target_sparsity", label: "Target Sparsity",
        type: "slider", min: 0, max: 0.9, step: 0.05, default: 0.5 },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: STAGE_TYPES.DEPLOYMENT,
    name: "Deployment",
    color: "#10b981",
    startApi: apiService.createDeploymentJob.bind(apiService),
    statusApi: apiService.getDeploymentStatus.bind(apiService),
    produces: [
      { kind: "endpoint", key: "endpoint", label: "Serving Endpoint" },
    ],
    fields: [
      { key: "model_path", label: "Model to Deploy", type: "artifact",
        accept: ["model", "finetuned_model", "optimized_model"],
        required: true },
      { key: "deployment_target", label: "Target", type: "select",
        options: ["local", "cloud", "edge"], default: "local" },
      { key: "serving_framework", label: "Framework", type: "select",
        options: ["torchserve", "tensorflow-serving", "onnx"],
        default: "torchserve" },
    ],
    advancedFields: [
      { key: "replicas", label: "Number of Replicas", type: "number",
        min: 1, max: 10, default: 1 },
      { key: "gpu_enabled", label: "Enable GPU", type: "boolean",
        default: false },
    ],
  },
];