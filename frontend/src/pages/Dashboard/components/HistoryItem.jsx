import { Paper, Box, Typography, IconButton } from '@mui/material';
import { Info as InfoIcon, Delete as DeleteIcon } from '@mui/icons-material';

export const HistoryItem = ({ item, onLoad, onDelete, onViewDetails }) => (
  <Paper
    sx={{
      p: 2, mb: 1, display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', cursor: 'pointer', transition: 'all .2s',
      '&:hover': { bgcolor: 'action.hover', transform: 'translateX(4px)' },
    }}
  >
    <Box sx={{ flex: 1 }} onClick={() => onLoad(item)}>
      <Typography variant="subtitle2">
        {item.name || `Pipeline ${new Date(item.createdAt).toLocaleString()}`}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {item.stages?.length || 0} stages • Created:{' '}
        {new Date(item.createdAt).toLocaleDateString()}
      </Typography>
    </Box>
    <Box>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onViewDetails(item); }}>
        <InfoIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  </Paper>
);