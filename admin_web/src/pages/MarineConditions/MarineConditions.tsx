import React, { useEffect, useState } from 'react';
import { Alert, Box, Chip, FormControl, MenuItem, Select, Skeleton, Stack, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import { useThemeContext } from '../../contexts/ThemeContext';
import { marineConditionsService } from '../../services/marineConditionsService';
import { HeroWeatherCard } from './components/HeroWeatherCard';
import { DataGridMetrics } from './components/DataGridMetrics';
import { ForecastSidebar } from './components/ForecastSidebar';
import { TideWaveSummary } from './components/TideWaveSummary';
import { AlertsBanner } from './components/AlertsBanner';
import { defaultMarineScopeId } from './mocks/marineData';
import type { MarineConditionsPayload } from './types/marine.types';

export const MarineConditions: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MarineConditionsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedScopeId, setSelectedScopeId] = useState(defaultMarineScopeId);
  const [sourceMode, setSourceMode] = useState<'mock' | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMarineConditions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await marineConditionsService.getMarineConditions(selectedScopeId);
        if (cancelled) return;

        setData(response.payload);
        setSourceMode(response.source);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load marine conditions.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      void loadMarineConditions();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedScopeId]);

  if (loading || !data) {
    return (
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          bgcolor: isDark ? '#0F172A' : '#FFFFFF',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4} spacing={2}>
          <Stack spacing={1}>
            <Skeleton variant="text" width={240} height={40} />
            <Skeleton variant="text" width={360} height={24} />
          </Stack>
          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
            <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" width={200} height={32} sx={{ borderRadius: 3 }} />
          </Stack>
        </Stack>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 3, lg: 4 } }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Skeleton variant="rounded" width="100%" height={80} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" width="100%" height={320} sx={{ borderRadius: 6 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: 6 }} />
              <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: 6 }} />
              <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: 6 }} />
              <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: 6 }} />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mt: 1 }}>
              <Skeleton variant="rounded" width="100%" height={240} sx={{ borderRadius: 6 }} />
              <Skeleton variant="rounded" width="100%" height={240} sx={{ borderRadius: 6 }} />
            </Box>
          </Box>

          <Box sx={{ width: { xs: '100%', lg: 320 }, minWidth: { lg: 300 } }}>
            <Skeleton
              variant="rounded"
              width="100%"
              height={800}
              sx={{ borderRadius: { xs: 6, md: '0 24px 24px 0' }, minHeight: 800 }}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  const updatedTime = new Date(data.lastUpdatedTime).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        bgcolor: isDark ? '#0F172A' : '#FFFFFF',
        minHeight: 'calc(100vh - 64px)',
        color: isDark ? '#E2F1F8' : '#1E293B',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        mb={3}
        gap={2}
      >
        <Box sx={{ flex: 1, pr: { md: 4 } }}>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.03em', mb: 1 }}>
            Marine Conditions
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.72 }}>
            Institutional weather, tide, and wave conditions for {data.selectedScope.name}, {data.selectedScope.state}. Last updated {updatedTime}.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexShrink: 0, mt: { xs: 2, md: 0 } }}>
          <Chip
            label={data.dataFreshness.toUpperCase()}
            size="small"
            color={data.dataFreshness === 'live' ? 'success' : data.dataFreshness === 'recent' ? 'info' : 'warning'}
            variant="outlined"
            sx={{ fontWeight: '600', animation: data.dataFreshness === 'live' ? 'pulse 2s infinite' : 'none' }}
          />

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select
              value={selectedScopeId}
              onChange={(event) => setSelectedScopeId(String(event.target.value))}
              startAdornment={<LanguageOutlinedIcon sx={{ mr: 1, opacity: 0.7 }} />}
              sx={{
                borderRadius: '12px',
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
                fontWeight: '600',
              }}
            >
              {data.availableScopes.map((scope) => (
                <MenuItem key={scope.id} value={scope.id}>
                  {scope.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {sourceMode === 'mock' && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          Preview mode: this page is currently using normalized frontend mock data through the marine conditions service boundary until backend feed ingestion is wired.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 3, lg: 4 } }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <AlertsBanner alerts={data.alerts} isDark={isDark} />

          <HeroWeatherCard data={data} isDark={isDark} />

          <DataGridMetrics data={data} isDark={isDark} />

          <TideWaveSummary data={data} isDark={isDark} />

          <Box sx={{ mt: 3, pt: 3, borderTop: '1px dashed', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.6 }} />
              <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500 }}>
                Data Provenance & Reliability
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {data.sources.map((src) => (
                <Stack key={src.id} direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: src.fallbackUsed ? 'warning.main' : 'success.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {src.name}:
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {src.attribution} (Updated: {new Date(src.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    {src.isDerived && ' - Derived Value'}
                    {src.fallbackUsed && ' - Fallback Source Used'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>

        <Box sx={{ width: { xs: '100%', lg: 320 }, minWidth: { lg: 300 } }}>
          <ForecastSidebar data={data} isDark={isDark} />
        </Box>
      </Box>
    </Box>
  );
};
