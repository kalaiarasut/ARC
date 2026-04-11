import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import type { MarineConditionsPayload } from '../types/marine.types';

interface DataGridMetricsProps {
  data: MarineConditionsPayload;
  isDark: boolean;
}

export const DataGridMetrics: React.FC<DataGridMetricsProps> = ({ data, isDark }) => {
  const { currentWeather, currentWave } = data;
  const rainLabel = currentWeather.rainChance >= 60 ? 'High' : currentWeather.rainChance >= 30 ? 'Moderate' : 'Low';
  const seaStateLabel = currentWave?.seaStateLabel ?? 'Unavailable';
  const seaStateQuality = seaStateLabel.toLowerCase() === 'slight' ? 20 : seaStateLabel.toLowerCase() === 'moderate' ? 45 : 75;
  const seaStateCaption = seaStateQuality >= 70 ? 'Rough' : seaStateQuality >= 40 ? 'Watch' : 'Good';

  const cardStyle = {
    p: 3,
    borderRadius: '24px',
    bgcolor: isDark ? 'rgba(30,41,59,0.5)' : '#F3F6F9',
    border: 'none',
    boxShadow: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 180,
    position: 'relative' as const,
  };

  const gaugeFillPct = 30;
  const arcLength = 188.5;
  const dashLength = (gaugeFillPct / 100) * arcLength;
  const needleRotation = -135 + (270 * (gaugeFillPct / 100));

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
      <Box sx={cardStyle}>
        <Box mb={4}>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Wind
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Today wind speed
          </Typography>
        </Box>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
          <Typography variant="h4" fontWeight="600" color="text.primary">
            {currentWeather.windSpeed} km/h
          </Typography>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '1px dashed #64B5F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <ExploreOutlinedIcon
              sx={{
                color: '#0288D1',
                fontSize: 32,
                transform: `rotate(${currentWeather.windDirection === 'NW' ? '-45deg' : '0deg'})`,
              }}
            />
            <Typography variant="caption" sx={{ position: 'absolute', top: -4, fontSize: 10, fontWeight: 'bold' }}>
              N
            </Typography>
            <Typography variant="caption" sx={{ position: 'absolute', bottom: -4, fontSize: 10, fontWeight: 'bold' }}>
              S
            </Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: -4, fontSize: 10, fontWeight: 'bold' }}>
              W
            </Typography>
            <Typography variant="caption" sx={{ position: 'absolute', right: -4, fontSize: 10, fontWeight: 'bold' }}>
              E
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={cardStyle}>
        <Box mb={4}>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Rain Chance
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Today rain chance
          </Typography>
        </Box>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
          <Typography variant="h4" fontWeight="600" color="text.primary">
            {currentWeather.rainChance}%
          </Typography>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" value={100} size={80} thickness={5} sx={{ color: isDark ? 'rgba(255,255,255,0.05)' : '#E3F2FD' }} />
            <CircularProgress variant="determinate" value={currentWeather.rainChance} size={80} thickness={5} sx={{ color: '#0288D1', position: 'absolute', left: 0, strokeLinecap: 'round' }} />
            <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" fontWeight="700" color="text.primary">
                {rainLabel}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      <Box sx={cardStyle}>
        <Box mb={4}>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Pressure
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Today pressure
          </Typography>
        </Box>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
          <Typography variant="h4" fontWeight="600" color="text.primary">
            {currentWeather.pressure} hPa
          </Typography>
          <Box sx={{ width: 80, height: 80, position: 'relative' }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
              <path d="M 21.7 78.3 A 40 40 0 1 1 78.3 78.3" fill="none" stroke={isDark ? 'rgba(255,255,255,0.15)' : '#E3F2FD'} strokeWidth="7" strokeDasharray="2 6" strokeLinecap="round" />
              <path d="M 21.7 78.3 A 40 40 0 1 1 78.3 78.3" fill="none" stroke={isDark ? '#64B5F6' : '#90CAF9'} strokeWidth="7" strokeDasharray={`${dashLength} ${arcLength}`} />
              <g transform={`rotate(${needleRotation} 50 50)`}>
                <line x1="50" y1="5" x2="50" y2="15" stroke={isDark ? '#E3F2FD' : '#0D47A1'} strokeWidth="5.5" strokeLinecap="round" />
                <circle cx="50" cy="50" r="5" fill="none" stroke={isDark ? '#E3F2FD' : '#0D47A1'} strokeWidth="2.5" />
                <line x1="50" y1="55" x2="50" y2="62" stroke={isDark ? '#E3F2FD' : '#0D47A1'} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="50" y1="45" x2="50" y2="15" stroke={isDark ? '#E3F2FD' : '#0D47A1'} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 43 25 L 50 15 L 57 25" fill="none" stroke={isDark ? '#E3F2FD' : '#0D47A1'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </Box>
        </Stack>
      </Box>

      <Box sx={cardStyle}>
        <Box mb={4}>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Sea State
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Current condition
          </Typography>
        </Box>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
          {currentWave ? (
            <Typography variant="h4" fontWeight="600" color="text.primary">
              {seaStateLabel}
            </Typography>
          ) : (
            <Typography variant="h4" fontWeight="600" color="text.secondary">
              N/A
            </Typography>
          )}
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" value={100} size={80} thickness={5} sx={{ color: '#E8F5E9' }} />
            <CircularProgress
              variant="determinate"
              value={seaStateQuality}
              size={80}
              thickness={5}
              sx={{
                color: seaStateQuality >= 70 ? '#EF5350' : seaStateQuality >= 40 ? '#FFB300' : '#4CAF50',
                position: 'absolute',
                left: 0,
                strokeLinecap: 'round',
              }}
            />
            <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" fontWeight="700" color="text.primary">
                {seaStateCaption}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};
