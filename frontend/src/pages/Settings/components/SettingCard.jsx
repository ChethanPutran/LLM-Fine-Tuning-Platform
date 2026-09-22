import { Card, CardContent, Box, Typography, Avatar, Divider } from '@mui/material';

export const SettingCard = ({ title, icon, description, children }) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{icon}</Avatar>
        <Box>
          <Typography variant="h6">{title}</Typography>
          {description && (
            <Typography variant="caption" color="text.secondary">{description}</Typography>
          )}
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);