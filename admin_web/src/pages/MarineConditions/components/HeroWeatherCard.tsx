import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import AirOutlinedIcon from '@mui/icons-material/AirOutlined';
import type { MarineConditionsPayload } from '../types/marine.types';

interface HeroWeatherCardProps {
  data: MarineConditionsPayload;
  isDark: boolean;
}

export const HeroWeatherCard: React.FC<HeroWeatherCardProps> = ({ data, isDark }) => {
  const { currentWeather, selectedScope } = data;

  const getGradient = () => {
    switch (currentWeather.icon) {
      case 'clear':
        return isDark
          ? 'linear-gradient(135deg, #1A365D 0%, #0A192F 100%)'
          : 'linear-gradient(135deg, rgba(200,225,255,1) 0%, rgba(180,210,245,1) 100%)';
      case 'clouds':
        return isDark
          ? 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)'
          : 'linear-gradient(135deg, #CFD8DC 0%, #90A4AE 100%)';
      case 'rain':
        return isDark
          ? 'linear-gradient(135deg, #2A4365 0%, #171923 100%)'
          : 'linear-gradient(135deg, #B0BEC5 0%, #78909C 100%)';
      case 'night':
        return isDark
          ? 'linear-gradient(135deg, #1A202C 0%, #000000 100%)'
          : 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)';
      default:
        return 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)';
    }
  };

  const getTextColor = () => {
    if (currentWeather.icon === 'night' && !isDark) return '#FFF';
    return isDark ? '#E2F1F8' : '#1A365D';
  };

  const pts = [
    { label: 'Morning', val: 15 },
    { label: 'Afternoon', val: 14 },
    { label: 'Evening', val: 16 },
    { label: 'Night', val: 12 },
  ];

  const minTime = Math.min(...pts.map((p) => p.val));
  const maxTime = Math.max(...pts.map((p) => p.val));
  const range = maxTime - minTime || 1;

  const width = 200;
  const height = 40;
  const padding = 10;

  const points = pts.map((p, i) => {
    const x = padding + (i * ((width - 2 * padding) / (pts.length - 1)));
    const y = height - padding - (((p.val - minTime) / range) * (height - 2 * padding));
    return { x, y };
  });

  const smoothPathD =
    `M ${points[0].x},${points[0].y} ` +
    points
      .slice(1)
      .map((p, i) => {
        const prev = points[i];
        const cx1 = prev.x + (p.x - prev.x) / 2;
        const cx2 = p.x - (p.x - prev.x) / 2;
        return `C ${cx1},${prev.y} ${cx2},${p.y} ${p.x},${p.y}`;
      })
      .join(' ');

  return (
    <Box
      sx={{
        borderRadius: '24px',
        background: getGradient(),
        p: 4,
        position: 'relative',
        overflow: 'hidden',
        color: getTextColor(),
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        boxShadow: isDark ? '0 8px 32px rgba(0,255,209,0.05)' : '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={4} justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LocationOnOutlinedIcon fontSize="small" />
            <Typography variant="subtitle1" fontWeight="600">
              {selectedScope.name}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Today {new Date(data.lastUpdatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Stack>

        <Box sx={{ my: 'auto' }}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Typography variant="h1" fontWeight="300" sx={{ fontSize: '6rem', lineHeight: 1 }}>
              {currentWeather.temperature}°
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.9, fontWeight: 500 }}>
            {currentWeather.label}
          </Typography>
          <Typography variant="caption" sx={{ mt: 1.25, display: 'block', opacity: 0.78 }}>
            {selectedScope.state} • Wind {currentWeather.windDirection} • Feels like {currentWeather.feelsLike ?? currentWeather.temperature}°
          </Typography>
        </Box>

        <Stack direction="row" spacing={3} mt={4}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Pressure
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {currentWeather.pressure} hPa
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <WaterDropOutlinedIcon fontSize="inherit" sx={{ opacity: 0.8 }} />
            <Typography variant="body2" fontWeight="600">
              {currentWeather.humidity}%
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <AirOutlinedIcon fontSize="inherit" sx={{ opacity: 0.8 }} />
            <Typography variant="body2" fontWeight="600">
              {currentWeather.windSpeed} km/h
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 320,
          p: { xs: 2, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" fontWeight="600" mb={1}>
          Temperature
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.76, mb: 3 }}>
          {currentWeather.trendText}
        </Typography>
        <Box sx={{ position: 'relative', width: '100%', height: 60 }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
            <path d={smoothPathD} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="currentColor" strokeWidth="1" />
            ))}
          </svg>
        </Box>
        <Stack direction="row" justifyContent="space-between" mt={3}>
          {pts.map((p, i) => (
            <Stack key={i} alignItems="center" spacing={0.5}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {p.label}
              </Typography>
              <Typography variant="body2" fontWeight="600">
                {p.val}°
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
