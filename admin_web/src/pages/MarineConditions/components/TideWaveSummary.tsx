import React from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import WaterOutlinedIcon from '@mui/icons-material/WaterOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import type { MarineConditionsPayload } from '../types/marine.types';

interface TideWaveSummaryProps {
  data: MarineConditionsPayload;
  isDark: boolean;
}

export const TideWaveSummary: React.FC<TideWaveSummaryProps> = ({ data, isDark }) => {
  const { currentTide, currentWave } = data;

  const cardStyle = {
    p: 3,
    borderRadius: '24px',
    bgcolor: isDark ? 'rgba(30,41,59,0.5)' : '#F8FAFC',
    border: 'none',
    boxShadow: 'none',
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 1 }}>
      <Box sx={cardStyle}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <WaterOutlinedIcon color="primary" />
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Tide Details
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

        {currentTide ? (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Current Status
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" color={currentTide.currentStatus === 'falling' ? 'error.main' : 'success.main'}>
                {currentTide.currentStatus === 'falling' ? <TrendingDownOutlinedIcon fontSize="small" /> : <TrendingUpOutlinedIcon fontSize="small" />}
                <Typography variant="subtitle2" fontWeight="600" sx={{ textTransform: 'capitalize' }}>
                  {currentTide.currentStatus}
                </Typography>
              </Stack>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Current Level
              </Typography>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {currentTide.currentLevel ?? 'N/A'}{currentTide.currentLevel !== null ? ' m' : ''}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Next High Tide
              </Typography>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {currentTide.nextHighTime ?? 'N/A'}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Next Low Tide
              </Typography>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {currentTide.nextLowTime ?? 'N/A'}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              {currentTide.trendIndicator}
            </Typography>
            {currentTide.tomorrowPreview && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                {currentTide.tomorrowPreview}
              </Typography>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Tide data currently unavailable for this station.
          </Typography>
        )}
      </Box>

      <Box sx={cardStyle}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <TimelineOutlinedIcon color="primary" />
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Wave & Sea State
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

        {currentWave ? (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Significant Height
              </Typography>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {currentWave.significantHeight ?? 'N/A'}{currentWave.significantHeight !== null ? ' m' : ''}
              </Typography>
            </Stack>
            {currentWave.swellHeight !== undefined && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Swell Height
                </Typography>
                <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                  {currentWave.swellHeight ?? 'N/A'}{currentWave.swellHeight !== null ? ' m' : ''}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Wave Direction
              </Typography>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {currentWave.direction ?? 'N/A'}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Wave Period
              </Typography>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {currentWave.period ?? 'N/A'}{currentWave.period !== null ? ' s' : ''}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              {currentWave.trendText}
            </Typography>
            {currentWave.impactNote && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'warning.main', fontWeight: '500' }}>
                {currentWave.impactNote}
              </Typography>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Wave data currently unavailable for this station.
          </Typography>
        )}
      </Box>
    </Box>
  );
};
