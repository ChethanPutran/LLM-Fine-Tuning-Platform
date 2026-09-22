/**
 * Declarative stage dependency graph.
 *
 * Artifacts are symbolic names (not file paths):
 *
 *   data_collection → raw_data
 *   preprocessing   → clean_data
 *   tokenization    → tokenizer
 *   training        → model
 *   finetuning      → finetuned_model
 *   optimization    → optimized_model
 *   deployment      → endpoint
 *
 * `requires` is the set of artifacts a stage needs present *somewhere*
 * upstream in the pipeline before it can be added.
 *
 * To relax a rule (e.g. allow training on externally-provided data),
 * remove the artifact from `requires`. To tighten it, add more.
 */
export const STAGE_IO = {
  data_collection: { requires: [],                produces: ['raw_data'] },
  preprocessing:   { requires: ['raw_data'],      produces: ['clean_data'] },
  tokenization:    { requires: ['clean_data'],    produces: ['tokenizer'] },
  training:        { requires: ['clean_data'],    produces: ['model'] },
  finetuning:      { requires: ['model'],         produces: ['finetuned_model'] },
  optimization:    { requires: ['model'],         produces: ['optimized_model'] },
  deployment:      { requires: ['model'],         produces: ['endpoint'] },
};

/** Human-readable labels used in error messages. */
export const ARTIFACT_LABELS = {
  raw_data:        'raw data',
  clean_data:      'preprocessed data',
  tokenizer:       'a tokenizer',
  model:           'a trained model',
  finetuned_model: 'a fine-tuned model',
  optimized_model: 'an optimized model',
  endpoint:        'a deployed endpoint',
};