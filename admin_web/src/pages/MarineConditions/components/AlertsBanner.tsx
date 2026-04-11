import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { OfficialAlert } from '../types/marine.types';

interface AlertsBannerProps {
  alerts: OfficialAlert[];
  isDark: boolean;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts, isDark }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: '12px',
          bgcolor: isDark ? 'rgba(33, 150, 243, 0.08)' : '#f8fbff',
          color: isDark ? '#90CAF9' : '#1976d2',
          border: '1px solid',
          borderColor: isDark ? 'rgba(144, 202, 249, 0.2)' : 'rgba(25, 118, 210, 0.16)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <InfoOutlinedIcon />
        <Box flex={1}>
          <Typography variant="subtitle2" fontWeight="700">
            No Active Official Alerts
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            No active weather, tide, or wave advisories are currently affecting the selected scope.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      {alerts.map((alert) => {
        const isSevere = alert.severity === 'warning' || alert.severity === 'severe';
        const isAdvisory = alert.severity === 'advisory';

        let bgcolor = 'rgba(33, 150, 243, 0.1)';
        let color = '#1976d2';
        let borderColor = 'rgba(33, 150, 243, 0.3)';
        let Icon = InfoOutlinedIcon;

        if (isSevere) {
          bgcolor = isDark ? 'rgba(211, 47, 47, 0.1)' : '#ffebee';
          color = isDark ? '#ef5350' : '#c62828';
          borderColor = 'rgba(211, 47, 47, 0.3)';
          Icon = WarningAmberIcon;
        } else if (isAdvisory) {
          bgcolor = isDark ? 'rgba(237, 108, 2, 0.1)' : '#fff8e1';
          color = isDark ? '#ff9800' : '#e65100';
          borderColor = 'rgba(237, 108, 2, 0.3)';
          Icon = WarningAmberIcon;
        }

        return (
          <Box
            key={alert.id}
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor,
              color,
              border: '1px solid',
              borderColor,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <Icon sx={{ mt: 0.5 }} />
            <Box flex={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="subtitle2" fontWeight="700">
                  {alert.authority}: {alert.type}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                  Until {new Date(alert.validUntil).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {alert.summary}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};
