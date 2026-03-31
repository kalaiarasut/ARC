import React from 'react';
import { Box, Button, Paper, Typography, alpha, useTheme } from '@mui/material';
import type { AdminUserProfile, UserStatus } from '../../types/adminManagement';
import { labelForUserStatus } from '../../utils/adminManagementFormatters';

export const LifecycleTab: React.FC<{
  isDark: boolean;
  user: AdminUserProfile;
  onStatusAction: (status: UserStatus) => void;
}> = ({ isDark, user, onStatusAction }) => {
  const theme = useTheme();

  const getLightButtonStyle = (color: string) => ({
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: '8px',
    px: 3,
    py: 0.75,
    color: color,
    bgcolor: alpha(color, 0.1),
    boxShadow: 'none',
    '&:hover': {
      bgcolor: alpha(color, 0.2),
      boxShadow: 'none',
    }
  });

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? alpha('#0f172a', 0.4) : '#ffffff' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1.5, fontSize: '1.1rem' }}>
        Lifecycle Management
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Current status: <strong style={{ color: theme.palette.text.primary }}>{labelForUserStatus(user.status)}</strong>
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Button variant="contained" onClick={() => onStatusAction('active')} sx={getLightButtonStyle(theme.palette.success.main)}>
          Activate
        </Button>
        <Button variant="contained" onClick={() => onStatusAction('suspended')} sx={getLightButtonStyle(theme.palette.warning.main)}>
          Suspend
        </Button>
        <Button variant="contained" onClick={() => onStatusAction('deactivated')} sx={getLightButtonStyle(theme.palette.warning.dark)}>
          Deactivate
        </Button>
        <Button variant="contained" onClick={() => onStatusAction('terminated')} sx={getLightButtonStyle(theme.palette.error.main)}>
          Terminate
        </Button>
      </Box>
    </Paper>
  );
};
