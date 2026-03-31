import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import LockClockIcon from '@mui/icons-material/LockClock';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RadarIcon from '@mui/icons-material/Radar';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShieldIcon from '@mui/icons-material/Shield';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined';

import type { GeneratedRiskZone, RiskZoneLevel, RiskZoneStatus } from '../types/riskZone';
import { riskZoneService } from '../services/riskZoneService';
import { isSupabaseConfigured } from '../core/supabase_config';
import { monitoringZoneService } from '../services/monitoringZoneService';
import type { MonitoringZone, ZoneTransitionEvent } from '../types/monitoringZone';

const levelConfig = (level: RiskZoneLevel) => {
  switch (level) {
    case 'high_risk':
      return { color: '#ef4444', bg: '#fef2f2', label: 'HIGH RISK', icon: WarningAmberIcon };
    case 'caution':
      return { color: '#eab308', bg: '#fffbeb', label: 'CAUTION', icon: ShieldIcon };
    case 'informational':
    default:
      return { color: '#22c55e', bg: '#f0fdf4', label: 'LOW', icon: InfoOutlinedIcon };
  }
};

const statusConfig = (status: RiskZoneStatus) => {
  switch (status) {
    case 'verified':
      return { color: 'success' as const, label: 'Verified', variant: 'filled' as const };
    case 'suppressed':
      return { color: 'default' as const, label: 'Suppressed', variant: 'outlined' as const };
    case 'locked':
      return { color: 'warning' as const, label: 'Locked', variant: 'filled' as const };
    case 'candidate':
    default:
      return { color: 'info' as const, label: 'Candidate', variant: 'outlined' as const };
  }
};

export const GeneratedZones: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [zones, setZones] = useState<GeneratedRiskZone[]>([]);
  const [monitoringZones, setMonitoringZones] = useState<MonitoringZone[]>([]);
  const [activity, setActivity] = useState<ZoneTransitionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState<'all' | 'entered' | 'exited'>('all');

  // Default bounds: broadly India
  const [minLat, setMinLat] = useState('6');
  const [maxLat, setMaxLat] = useState('38');
  const [minLon, setMinLon] = useState('68');
  const [maxLon, setMaxLon] = useState('98');

  const getBounds = () => {
    const parsed = {
      minLat: Number(minLat),
      maxLat: Number(maxLat),
      minLon: Number(minLon),
      maxLon: Number(maxLon),
    };
    if (!Number.isFinite(parsed.minLat) || !Number.isFinite(parsed.maxLat) || 
        !Number.isFinite(parsed.minLon) || !Number.isFinite(parsed.maxLon)) {
      return null;
    }
    return parsed;
  };

  const loadZones = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in admin_web/.env.local and restart the dev server.');
      return;
    }
    const bounds = getBounds();
    if (!bounds) {
      setError('Invalid bounds. Please enter numeric coordinates.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await riskZoneService.listInBounds(bounds, true);
      setZones(data);
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || (e as any)?.error_description || 'Unknown error';
      setError(`Failed to load generated zones: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMonitoringActivity = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      setActivityLoading(true);
      const [zoneRows, eventRows] = await Promise.all([
        monitoringZoneService.list(),
        monitoringZoneService.listRecentActivity({
          limit: 50,
          zoneId: selectedZoneId === 'all' ? null : selectedZoneId,
          eventType: selectedEventType === 'all' ? null : selectedEventType,
        }),
      ]);

      setMonitoringZones(zoneRows);
      setActivity(eventRows);
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || (e as any)?.error_description || 'Unknown error';
      setError(`Failed to load monitoring activity: ${msg}`);
    } finally {
      setActivityLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadZones(), loadMonitoringActivity()]);
  };

  const recompute = async () => {
    try {
      setActionLoading('recompute');
      setError(null);
      await riskZoneService.recompute();
      await refreshAll();
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || (e as any)?.error_description || 'Unknown error';
      setError(`Recompute failed: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  };

  const setStatus = async (zone: GeneratedRiskZone, status: RiskZoneStatus) => {
    try {
      setActionLoading(zone.id);
      setError(null);
      const lockUntil = status === 'locked' ? new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() : null;
      await riskZoneService.updateStatus({ zoneId: zone.id, status, lockUntil });
      await loadZones();
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || (e as any)?.error_description || 'Unknown error';
      setError(`Update failed: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    void refreshAll();

    const channel = riskZoneService.subscribeToRiskZones({
      onInsert: () => {
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          refreshTimerRef.current = null;
          void refreshAll();
        }, 400);
      },
      onUpdate: () => {
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          refreshTimerRef.current = null;
          void refreshAll();
        }, 400);
      },
      onDelete: () => {
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          refreshTimerRef.current = null;
          void refreshAll();
        }, 400);
      },
    });

    const monitoringChannel = monitoringZoneService.subscribeToMonitoringActivity({
      onEvent: () => {
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          refreshTimerRef.current = null;
          void loadMonitoringActivity();
        }, 400);
      },
      onZoneChange: () => {
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          refreshTimerRef.current = null;
          void loadMonitoringActivity();
        }, 400);
      },
    });

    return () => {
      channel.unsubscribe();
      monitoringChannel.unsubscribe();
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadMonitoringActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZoneId, selectedEventType]);

  const zonesByLevel = {
    high_risk: zones.filter(z => z.level === 'high_risk').length,
    caution: zones.filter(z => z.level === 'caution').length,
    informational: zones.filter(z => z.level === 'informational').length,
  };
  const totalOccupants = monitoringZones.reduce((sum, zone) => sum + (zone.people_count || 0), 0);

  const formatCompactId = (value: string) =>
    value.length <= 12 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`;

  const eventConfig = (eventType: ZoneTransitionEvent['event_type']) =>
    eventType === 'entered'
      ? { label: 'Entered', color: '#0f766e', bg: alpha('#0f766e', 0.12), icon: LoginOutlinedIcon }
      : { label: 'Exited', color: '#b45309', bg: alpha('#b45309', 0.12), icon: LogoutOutlinedIcon };

  const deliveryConfig = (status: ZoneTransitionEvent['delivery_status']) => {
    switch (status) {
      case 'sent':
        return { label: 'Sent', color: 'success' as const, variant: 'filled' as const };
      case 'failed':
        return { label: 'Failed', color: 'error' as const, variant: 'filled' as const };
      case 'skipped':
        return { label: 'Skipped', color: 'warning' as const, variant: 'outlined' as const };
      case 'queued':
      default:
        return { label: 'Queued', color: 'info' as const, variant: 'outlined' as const };
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? 'background.default' : alpha(theme.palette.primary.main, 0.02) }}>
      {/* Premium Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          background: isDark
            ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark
                  ? 'linear-gradient(135deg, #00ffd1 0%, #00ccA7 100%)'
                  : `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                boxShadow: isDark
                  ? '0 0 15px rgba(0, 255, 209, 0.3)'
                  : `0 4px 14px ${alpha(theme.palette.secondary.main, 0.35)}`,
              }}
            >
              <RadarIcon sx={{ color: isDark ? '#040b16' : 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, letterSpacing: -0.5 }}>
                Generated Risk Zones
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.3 }}>
                AI-computed hazard clusters
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Quick Stats */}
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label={`${zonesByLevel.high_risk} High Risk`}
                sx={{
                  bgcolor: alpha('#ef4444', 0.1),
                  color: '#ef4444',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              />
              <Chip
                size="small"
                label={`${zonesByLevel.caution} Caution`}
                sx={{
                  bgcolor: alpha('#f59e0b', 0.1),
                  color: '#f59e0b',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              />
              <Chip
                size="small"
                label={`${zones.length} Total`}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: 11,
                }}
              />
            </Stack>

            <Button
              variant="contained"
              size="small"
              startIcon={actionLoading === 'recompute' ? null : <AutoAwesomeIcon />}
              onClick={recompute}
              disabled={!!actionLoading}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                background: isDark
                  ? 'linear-gradient(135deg, #00ffd1 0%, #00ccA7 100%)'
                  : `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                color: isDark ? '#040b16' : '#ffffff',
                boxShadow: isDark
                  ? '0 0 15px rgba(0, 255, 209, 0.3)'
                  : `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
              }}
            >
              {actionLoading === 'recompute' ? 'Computing…' : 'Recompute Zones'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Bounds Filter Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: '16px',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.8),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" gap={1.5}>
            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ minWidth: 80 }}>
              Bounds Filter
            </Typography>
            <TextField
              label="Min Lat"
              size="small"
              value={minLat}
              onChange={(e) => setMinLat(e.target.value)}
              sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Max Lat"
              size="small"
              value={maxLat}
              onChange={(e) => setMaxLat(e.target.value)}
              sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Min Lon"
              size="small"
              value={minLon}
              onChange={(e) => setMinLon(e.target.value)}
              sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Max Lon"
              size="small"
              value={maxLon}
              onChange={(e) => setMaxLon(e.target.value)}
              sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => { void refreshAll(); }}
              disabled={loading}
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              {loading ? 'Loading…' : 'Refresh'}
            </Button>
          </Stack>
        </Paper>

        {/* Zones List */}
        <Stack spacing={1.5}>
          {loading && zones.length === 0 ? (
            // Loading Skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Paper
                key={i}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="60%" height={24} />
                    <Skeleton width="40%" height={18} />
                  </Box>
                  <Skeleton width={200} height={36} />
                </Stack>
              </Paper>
            ))
          ) : zones.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                borderRadius: '16px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                textAlign: 'center',
              }}
            >
              <RadarIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                No Risk Zones Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 400, mx: 'auto' }}>
                Click "Recompute Zones" to generate risk zones based on recent hazard reports, or adjust the bounds filter.
              </Typography>
            </Paper>
          ) : (
            zones.map((z) => {
              const level = levelConfig(z.level);
              const status = statusConfig(z.status);
              const LevelIcon = level.icon;
              const isActionLoading = actionLoading === z.id;

              return (
                <Paper
                  key={z.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: alpha(level.bg, 0.3),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: `0 4px 20px ${alpha(level.color, 0.15)}`,
                      borderColor: alpha(level.color, 0.3),
                    },
                  }}
                >
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                    {/* Level Icon */}
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(level.color, 0.15),
                        flexShrink: 0,
                      }}
                    >
                      <LevelIcon sx={{ color: level.color, fontSize: 24 }} />
                    </Box>

                    {/* Zone Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          label={level.label}
                          sx={{
                            bgcolor: alpha(level.color, 0.15),
                            color: level.color,
                            fontWeight: 700,
                            fontSize: 10,
                            height: 22,
                            letterSpacing: 0.5,
                          }}
                        />
                        <Chip
                          size="small"
                          label={status.label}
                          color={status.color}
                          variant={status.variant}
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      </Stack>

                      <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" sx={{ color: 'text.secondary' }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <TrendingUpIcon sx={{ fontSize: 14 }} />
                          <Typography variant="body2" fontWeight={500}>
                            Score: {z.score.toFixed(1)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <LocationOnIcon sx={{ fontSize: 14 }} />
                          <Typography variant="body2">
                            {z.center_lat.toFixed(4)}, {z.center_lon.toFixed(4)}
                          </Typography>
                        </Stack>
                        <Typography variant="body2">
                          {z.report_count} reports ({z.verified_count} verified) • {Math.round(z.radius_meters)}m radius
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.disabled">
                          Last seen {new Date(z.last_seen_at).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                      <Tooltip title="Mark as verified">
                        <IconButton
                          size="small"
                          onClick={() => setStatus(z, 'verified')}
                          disabled={isActionLoading || z.status === 'verified'}
                          sx={{
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: 'success.main',
                            '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) },
                            '&.Mui-disabled': { opacity: 0.4 },
                          }}
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Suppress zone">
                        <IconButton
                          size="small"
                          onClick={() => setStatus(z, 'suppressed')}
                          disabled={isActionLoading || z.status === 'suppressed'}
                          sx={{
                            bgcolor: alpha(theme.palette.grey[500], 0.1),
                            color: 'text.secondary',
                            '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.2) },
                            '&.Mui-disabled': { opacity: 0.4 },
                          }}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Lock for 6 hours">
                        <IconButton
                          size="small"
                          onClick={() => setStatus(z, 'locked')}
                          disabled={isActionLoading || z.status === 'locked'}
                          sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: 'warning.main',
                            '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) },
                            '&.Mui-disabled': { opacity: 0.4 },
                          }}
                        >
                          <LockClockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset to candidate">
                        <IconButton
                          size="small"
                          onClick={() => setStatus(z, 'candidate')}
                          disabled={isActionLoading || z.status === 'candidate'}
                          sx={{
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: 'info.main',
                            '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) },
                            '&.Mui-disabled': { opacity: 0.4 },
                          }}
                        >
                          <RestartAltIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })
          )}
        </Stack>

        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            borderRadius: '16px',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.88),
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Recent Monitoring Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Device entry and exit events from monitoring zones
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                icon={<RadarIcon sx={{ fontSize: 16 }} />}
                label={`${monitoringZones.length} monitoring zones`}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<PhoneAndroidOutlinedIcon sx={{ fontSize: 16 }} />}
                label={`${totalOccupants} active occupants`}
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                  color: theme.palette.secondary.dark,
                  fontWeight: 700,
                }}
              />
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="monitoring-zone-filter-label">Zone</InputLabel>
              <Select
                labelId="monitoring-zone-filter-label"
                label="Zone"
                value={selectedZoneId}
                onChange={(event) => setSelectedZoneId(event.target.value)}
              >
                <MenuItem value="all">All monitoring zones</MenuItem>
                {monitoringZones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name} ({zone.people_count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="monitoring-event-filter-label">Event</InputLabel>
              <Select
                labelId="monitoring-event-filter-label"
                label="Event"
                value={selectedEventType}
                onChange={(event) => setSelectedEventType(event.target.value as 'all' | 'entered' | 'exited')}
              >
                <MenuItem value="all">All events</MenuItem>
                <MenuItem value="entered">Entered</MenuItem>
                <MenuItem value="exited">Exited</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <TableContainer sx={{ borderRadius: '14px', border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>Zone</TableCell>
                  <TableCell>User / Device</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Delivery</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activityLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={`activity-skeleton-${index}`}>
                      <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="text" width={140} /></TableCell>
                      <TableCell><Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 2 }} /></TableCell>
                      <TableCell><Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 2 }} /></TableCell>
                      <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    </TableRow>
                  ))
                ) : activity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No monitoring activity yet.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  activity.map((event) => {
                    const eventMeta = eventConfig(event.event_type);
                    const delivery = deliveryConfig(event.delivery_status);
                    const EventIcon = eventMeta.icon;

                    return (
                      <TableRow key={event.id} hover>
                        <TableCell>
                          <Chip
                            icon={<EventIcon sx={{ fontSize: 14 }} />}
                            label={eventMeta.label}
                            sx={{
                              bgcolor: eventMeta.bg,
                              color: eventMeta.color,
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" fontWeight={600}>
                              {event.zone_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" fontWeight={600}>
                              {formatCompactId(event.user_id)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCompactId(event.device_id)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={event.source === 'background' ? 'Background' : 'Foreground'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={delivery.label}
                            color={delivery.color}
                            variant={delivery.variant}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {new Date(event.occurred_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(event.occurred_at).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default GeneratedZones;
