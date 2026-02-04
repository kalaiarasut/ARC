import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import LockClockIcon from '@mui/icons-material/LockClock';

import type { GeneratedRiskZone, RiskZoneLevel, RiskZoneStatus } from '../types/riskZone';
import { riskZoneService } from '../services/riskZoneService';
import { isSupabaseConfigured } from '../core/supabase_config';

const levelColor = (level: RiskZoneLevel) => {
  switch (level) {
    case 'high_risk':
      return 'error' as const;
    case 'caution':
      return 'warning' as const;
    case 'informational':
    default:
      return 'info' as const;
  }
};

const statusColor = (status: RiskZoneStatus) => {
  switch (status) {
    case 'verified':
      return 'success' as const;
    case 'suppressed':
      return 'default' as const;
    case 'locked':
      return 'warning' as const;
    case 'candidate':
    default:
      return 'info' as const;
  }
};

export const GeneratedZones: React.FC = () => {
  const [zones, setZones] = useState<GeneratedRiskZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminCheck, setAdminCheck] = useState<boolean | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  // Default bounds: broadly India
  const [minLat, setMinLat] = useState('6');
  const [maxLat, setMaxLat] = useState('38');
  const [minLon, setMinLon] = useState('68');
  const [maxLon, setMaxLon] = useState('98');

  const bounds = useMemo(() => {
    const parsed = {
      minLat: Number(minLat),
      maxLat: Number(maxLat),
      minLon: Number(minLon),
      maxLon: Number(maxLon),
    };
    if (!Number.isFinite(parsed.minLat) || !Number.isFinite(parsed.maxLat) || !Number.isFinite(parsed.minLon) || !Number.isFinite(parsed.maxLon)) {
      return null;
    }
    return parsed;
  }, [minLat, maxLat, minLon, maxLon]);

  const loadZones = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in admin_web/.env.local and restart the dev server.');
      return;
    }
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

  const recompute = async () => {
    try {
      setLoading(true);
      setError(null);
      await riskZoneService.recompute();
      await loadZones();
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || (e as any)?.error_description || 'Unknown error';
      setError(`Recompute failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (zone: GeneratedRiskZone, status: RiskZoneStatus) => {
    try {
      setLoading(true);
      setError(null);
      const lockUntil = status === 'locked' ? new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() : null;
      await riskZoneService.updateStatus({ zoneId: zone.id, status, lockUntil });
      await loadZones();
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || (e as any)?.error_description || 'Unknown error';
      setError(`Update failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();

    // Check admin role as seen by the backend (RPC uses auth.uid()).
    void riskZoneService
      .isAdmin()
      .then((v) => setAdminCheck(v))
      .catch((e) => {
        console.error(e);
        setAdminCheck(null);
      });

    const channel = riskZoneService.subscribeToRiskZones({
      onInsert: () => {
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          refreshTimerRef.current = null;
          void loadZones();
        }, 400);
      },
      onUpdate: () => {
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          refreshTimerRef.current = null;
          void loadZones();
        }, 400);
      },
      onDelete: () => {
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          refreshTimerRef.current = null;
          void loadZones();
        }, 400);
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      channel.unsubscribe();
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return (
    <Box>
      {/* Header removed */}

      <Paper elevation={1} sx={{ p: 2, mt: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Admin role check:
          </Typography>
          {adminCheck === null ? (
            <Chip size="small" label="unknown" variant="outlined" />
          ) : adminCheck ? (
            <Chip size="small" label="admin" color="success" />
          ) : (
            <Chip size="small" label="not admin" color="warning" />
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 120 }}>
            Bounds
          </Typography>

          <TextField label="Min Lat" size="small" value={minLat} onChange={(e) => setMinLat(e.target.value)} />
          <TextField label="Max Lat" size="small" value={maxLat} onChange={(e) => setMaxLat(e.target.value)} />
          <TextField label="Min Lon" size="small" value={minLon} onChange={(e) => setMinLon(e.target.value)} />
          <TextField label="Max Lon" size="small" value={maxLon} onChange={(e) => setMaxLon(e.target.value)} />

          <Button variant="outlined" onClick={loadZones} disabled={loading} startIcon={<RefreshIcon />}>
            {loading ? 'Loading…' : 'Load'}
          </Button>

          <Button variant="contained" onClick={recompute} disabled={loading}>
            Recompute Zones
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1.5}>
          {zones.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No zones returned. If zones exist but you can’t see them, add your user to app_roles as admin, then click “Recompute Zones”.
            </Typography>
          ) : (
            zones.map((z) => (
              <Paper key={z.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                  <Box sx={{ flex: 1, minWidth: 260 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                      <Chip size="small" label={z.level} color={levelColor(z.level)} />
                      <Chip size="small" label={z.status} color={statusColor(z.status)} variant={z.status === 'suppressed' ? 'outlined' : 'filled'} />
                      <Typography variant="body2" color="text.secondary">
                        score {z.score.toFixed(1)} • reports {z.report_count} (verified {z.verified_count})
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {z.center_lat.toFixed(4)}, {z.center_lon.toFixed(4)} • radius {Math.round(z.radius_meters)} m
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      last seen {new Date(z.last_seen_at).toLocaleString()} • active until {new Date(z.active_until).toLocaleString()}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={() => setStatus(z, 'verified')}
                      disabled={loading}
                    >
                      Verify
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<BlockIcon />}
                      onClick={() => setStatus(z, 'suppressed')}
                      disabled={loading}
                    >
                      Suppress
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LockClockIcon />}
                      onClick={() => setStatus(z, 'locked')}
                      disabled={loading}
                    >
                      Lock 6h
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setStatus(z, 'candidate')}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default GeneratedZones;
