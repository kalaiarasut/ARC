import React from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import type { MarineConditionsPayload } from '../types/marine.types';

interface ForecastSidebarProps {
  data: MarineConditionsPayload;
  isDark: boolean;
}

export const ForecastSidebar: React.FC<ForecastSidebarProps> = ({ data, isDark }) => {
  const getIcon = (iconStr: string, size = 20) => {
    switch (iconStr) {
      case 'clear':
        return <WbSunnyOutlinedIcon sx={{ color: '#FFB300', fontSize: size }} />;
      case 'clouds':
        return <CloudOutlinedIcon sx={{ color: '#90A4AE', fontSize: size }} />;
      case 'rain':
        return <WaterDropOutlinedIcon sx={{ color: '#64B5F6', fontSize: size }} />;
      default:
        return <WbSunnyOutlinedIcon sx={{ color: '#FFB300', fontSize: size }} />;
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        bgcolor: 'transparent',
        height: '100%',
        borderLeft: { md: '1px solid' },
        borderColor: { md: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      }}
    >
      <Stack direction="row" justifyContent="center" alignItems="center" mb={4} spacing={2} position="relative">
        <IconButton size="small" sx={{ position: 'absolute', left: 0 }}>
          <KeyboardArrowLeftIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight="600" color="text.primary">
          This Week
        </Typography>
        <IconButton size="small" sx={{ position: 'absolute', right: 0 }}>
          <KeyboardArrowRightIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Typography variant="subtitle2" fontWeight="600" mb={1} color="text.primary">
        Today
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.72, display: 'block', mb: 3 }}>
        Hourly weather outlook
      </Typography>

      <Stack direction="row" spacing={3} sx={{ overflowX: 'auto', pb: 1, mb: 4, '::-webkit-scrollbar': { display: 'none' } }}>
        {data.hourlyForecast.map((hr, i) => {
          const isNow = hr.time === 'Now';
          return (
            <Box
              key={i}
              sx={{
                minWidth: 64,
                p: 2,
                borderRadius: '24px',
                bgcolor: isNow ? '#E3F2FD' : 'transparent',
                color: isNow ? '#1565C0' : 'text.primary',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                opacity: isNow ? 1 : 0.8,
              }}
            >
              <Typography variant="caption" fontWeight={isNow ? 600 : 500}>
                {hr.time}
              </Typography>
              {getIcon(hr.icon, 28)}
              <Typography variant="subtitle1" fontWeight={isNow ? 700 : 600}>
                {hr.temp}°
              </Typography>
            </Box>
          );
        })}
      </Stack>

      <Stack spacing={4}>
        {data.dailyForecast.map((day, i) => (
          <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ width: '40%' }}>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {day.dayLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {day.date}
              </Typography>
            </Box>
            <Stack alignItems="flex-end" spacing={0.25}>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {day.highTemp}° / {day.lowTemp}°
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {day.weatherLabel}
              </Typography>
            </Stack>
            {getIcon(day.icon, 24)}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};
