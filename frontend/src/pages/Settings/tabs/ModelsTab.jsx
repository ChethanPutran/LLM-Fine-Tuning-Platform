import {
  Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch,
} from '@mui/material';
import { Memory, MonitorHeart } from '@mui/icons-material';
import { SettingCard } from '../components/SettingCard';

export const ModelsTab = ({ values, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <SettingCard title="Model Configuration" icon={<Memory />}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Default Model</InputLabel>
          <Select value={values.defaultModel} label="Default Model"
            onChange={(e) => onChange('defaultModel', e.target.value)}>
            <MenuItem value="bert-base-uncased">BERT Base Uncased</MenuItem>
            <MenuItem value="bert-large-uncased">BERT Large Uncased</MenuItem>
            <MenuItem value="gpt2">GPT-2</MenuItem>
            <MenuItem value="gpt2-medium">GPT-2 Medium</MenuItem>
            <MenuItem value="facebook/bart-base">BART Base</MenuItem>
            <MenuItem value="t5-small">T5 Small</MenuItem>
            <MenuItem value="roberta-base">RoBERTa Base</MenuItem>
            <MenuItem value="distilbert-base-uncased">DistilBERT Base</MenuItem>
          </Select>
        </FormControl>

        <TextField fullWidth label="Model Cache Path"
          value={values.modelCachePath}
          onChange={(e) => onChange('modelCachePath', e.target.value)} sx={{ mb: 2 }} />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Precision</InputLabel>
          <Select value={values.precision} label="Precision"
            onChange={(e) => onChange('precision', e.target.value)}>
            <MenuItem value="fp32">FP32 (Full Precision)</MenuItem>
            <MenuItem value="fp16">FP16 (Half Precision)</MenuItem>
            <MenuItem value="int8">INT8 (Quantized)</MenuItem>
            <MenuItem value="bf16">BF16 (Brain Float)</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={values.useGPU}
            onChange={(e) => onChange('useGPU', e.target.checked)} />}
          label="Use GPU" sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={values.gradientCheckpointing}
            onChange={(e) => onChange('gradientCheckpointing', e.target.checked)} />}
          label="Gradient Checkpointing"
        />
      </SettingCard>
    </Grid>

    <Grid item xs={12} md={6}>
      <SettingCard title="Training Parameters" icon={<MonitorHeart />}>
        <TextField fullWidth type="number" label="Max Sequence Length"
          value={values.maxSequenceLength}
          onChange={(e) => onChange('maxSequenceLength', parseInt(e.target.value))} sx={{ mb: 2 }} />

        <TextField fullWidth type="number" label="Dropout Rate"
          value={values.dropoutRate}
          onChange={(e) => onChange('dropoutRate', parseFloat(e.target.value))}
          inputProps={{ step: 0.01 }} sx={{ mb: 2 }} />

        <TextField fullWidth type="number" label="Weight Decay"
          value={values.weightDecay}
          onChange={(e) => onChange('weightDecay', parseFloat(e.target.value))}
          inputProps={{ step: 0.001 }} sx={{ mb: 2 }} />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Optimizer</InputLabel>
          <Select value={values.optimizer} label="Optimizer"
            onChange={(e) => onChange('optimizer', e.target.value)}>
            <MenuItem value="adamw">AdamW</MenuItem>
            <MenuItem value="adam">Adam</MenuItem>
            <MenuItem value="sgd">SGD</MenuItem>
            <MenuItem value="adafactor">Adafactor</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Learning Rate Scheduler</InputLabel>
          <Select value={values.learningRateScheduler} label="Learning Rate Scheduler"
            onChange={(e) => onChange('learningRateScheduler', e.target.value)}>
            <MenuItem value="linear">Linear</MenuItem>
            <MenuItem value="cosine">Cosine</MenuItem>
            <MenuItem value="constant">Constant</MenuItem>
            <MenuItem value="exponential">Exponential</MenuItem>
          </Select>
        </FormControl>
      </SettingCard>
    </Grid>
  </Grid>
);