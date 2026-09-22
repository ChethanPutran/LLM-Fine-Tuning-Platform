import { Box } from '@mui/material';

export const TabPanel = ({ children, value, index, ...rest }) => (
  <div role="tabpanel" hidden={value !== index} {...rest}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);