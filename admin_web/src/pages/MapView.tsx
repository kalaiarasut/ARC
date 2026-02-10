import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Paper,
    Stack,
    Typography,
    Button,
    Alert,
    FormControlLabel,
    Switch,
    IconButton,
    Tooltip,
    Chip,
    Fade,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import LayersIcon from '@mui/icons-material/Layers';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import TuneIcon from '@mui/icons-material/Tune';
import PlaceIcon from '@mui/icons-material/Place';
import GridViewIcon from '@mui/icons-material/GridView';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';

import LeafletMap, { type MapMethods } from '../components/LeafletMap';
import { hazardService } from '../services/hazardService';
import { advisoryService } from '../services/advisoryService';
import { riskZoneService } from '../services/riskZoneService';
import { monitoringZoneService } from '../services/monitoringZoneService';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { HazardReport } from '../types/hazard';
import type { OfficialAdvisory } from '../types/advisory';
import type { GeneratedRiskZone } from '../types/riskZone';
import type { MonitoringZone } from '../types/monitoringZone';
import { useSearchParams } from 'react-router-dom';

/**
 * MapView Page - World-Class Live Map Experience
 */
export const MapView: React.FC = () => {
    const theme = useTheme();
    const mapRef = useRef<MapMethods | null>(null);
    const [loading, setLoading] = useState(false);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [zonesError, setZonesError] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const [showFilters, setShowFilters] = useState(false);

    const [showZones, setShowZones] = useState(true);
    const [showCandidateZones, setShowCandidateZones] = useState(false);
    const [showSuppressedZones, setShowSuppressedZones] = useState(false);

    const [showMonitoringZones, setShowMonitoringZones] = useState(true);
    const [monitoringEditEnabled, setMonitoringEditEnabled] = useState(false);
    const [monitoringZonesCount, setMonitoringZonesCount] = useState(0);

    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [mockBusy, setMockBusy] = useState(false);
    const [markerCount, setMarkerCount] = useState(0);
    const [zoneCount, setZoneCount] = useState(0);

    const [nameDialogOpen, setNameDialogOpen] = useState(false);
    const [newZoneName, setNewZoneName] = useState('');
    const pendingMonitoringRef = useRef<{
        tempLayerId: number;
        center_lat: number;
        center_lng: number;
        radius_meters: number;
    } | null>(null);

    const formatRpcError = (e: unknown) => {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;
        if (e instanceof Error) return e.message;
        const anyE = e as any;
        const msg = anyE?.message || anyE?.error_description || anyE?.error || 'Unknown error';
        return msg;
    };

    const zonesRefreshTimerRef = useRef<number | null>(null);
    const zoneMoveHandlerBoundRef = useRef(false);

    const showZonesRef = useRef(showZones);
    const showCandidateRef = useRef(showCandidateZones);
    const showSuppressedRef = useRef(showSuppressedZones);

    useEffect(() => { showZonesRef.current = showZones; }, [showZones]);
    useEffect(() => { showCandidateRef.current = showCandidateZones; }, [showCandidateZones]);
    useEffect(() => { showSuppressedRef.current = showSuppressedZones; }, [showSuppressedZones]);

    useEffect(() => {
        mapRef.current?.setMonitoringZonesVisible(showMonitoringZones);
        if (showMonitoringZones) {
            void (async () => {
                try {
                    const zones = await monitoringZoneService.list();
                    mapRef.current?.setMonitoringZones(zones);
                    setMonitoringZonesCount(zones.length);
                } catch (e) {
                    console.error(e);
                }
            })();
        }
    }, [showMonitoringZones]);

    const focus = useMemo(() => {
        const reportId = searchParams.get('reportId');
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const parsedLat = lat ? Number(lat) : null;
        const parsedLng = lng ? Number(lng) : null;
        return {
            reportId,
            lat: Number.isFinite(parsedLat as number) ? (parsedLat as number) : null,
            lng: Number.isFinite(parsedLng as number) ? (parsedLng as number) : null,
        };
    }, [searchParams]);

    const toMarker = (r: HazardReport) => {
        const urgency = (r.urgency_level || 'Medium').toLowerCase();
        const title = `${r.hazard_type}${r.is_high_risk ? ' • HIGH RISK' : ''}`;
        return {
            id: r.id,
            lat: r.latitude,
            lng: r.longitude,
            kind: 'hazard' as const,
            hazardType: r.hazard_type,
            urgency,
            title,
            timestamp: r.created_at,
        };
    };

    const toAdvisoryMarker = (a: OfficialAdvisory) => {
        const contact = [a.contact_phone, a.contact_whatsapp, a.contact_hotline].filter(Boolean).join(' • ') || null;
        return {
            id: `adv:${a.id}`,
            lat: a.latitude ?? 0,
            lng: a.longitude ?? 0,
            kind: 'advisory' as const,
            category: a.category,
            severity: a.severity,
            region: a.region,
            startsAt: a.starts_at,
            expiresAt: a.expires_at,
            contact,
            title: a.title,
            timestamp: a.published_at,
        };
    };

    const loadLiveReports = async () => {
        if (!isSupabaseConfigured()) {
            setError('Supabase not configured. Cannot load live reports.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [reportsResult, advisories] = await Promise.all([
                hazardService.getReportsWithCount(undefined, 0, 200),
                advisoryService.getAdvisoriesWithLocation(200),
            ]);

            const { data } = reportsResult;

            mapRef.current?.clearAllMarkers();
            data.forEach((r) => mapRef.current?.addMarker(toMarker(r)));

            const advisoriesWithLocation = advisories.filter((a) => a.latitude !== null && a.longitude !== null);
            advisoriesWithLocation.forEach((a) => mapRef.current?.addMarker(toAdvisoryMarker(a)));

            setMarkerCount(data.length + advisoriesWithLocation.length);

            if (showZonesRef.current) {
                void loadZonesForCurrentBounds();
            }

            if (focus.lat !== null && focus.lng !== null) {
                mapRef.current?.panToLocation(focus.lat, focus.lng, 13);
            } else if (focus.reportId) {
                const match = data.find((r) => r.id === focus.reportId);
                if (match) {
                    mapRef.current?.panToLocation(match.latitude, match.longitude, 13);
                }
            }
        } catch (e) {
            console.error(e);
            setError('Failed to load live reports.');
        } finally {
            setLoading(false);
        }
    };

    const loadMonitoringZones = async () => {
        if (!isSupabaseConfigured()) return;
        try {
            const zones = await monitoringZoneService.list();
            mapRef.current?.setMonitoringZones(zones);
            setMonitoringZonesCount(zones.length);
        } catch (e) {
            console.error(e);
            setError(`Failed to load monitoring zones: ${formatRpcError(e)}`);
        }
    };

    const zoneLevelColor = (level: GeneratedRiskZone['level']) => {
        if (level === 'high_risk') return '#ef4444';
        if (level === 'caution') return '#eab308';
        return '#22c55e';
    };

    const isZoneVisible = (z: GeneratedRiskZone) => {
        if (z.status === 'verified' || z.status === 'locked') return true;
        if (z.status === 'candidate') return showCandidateRef.current;
        if (z.status === 'suppressed') return showSuppressedRef.current;
        return false;
    };

    const loadZonesForCurrentBounds = async () => {
        if (!isSupabaseConfigured()) return;
        const map = mapRef.current;
        if (!map) return;
        if (!showZonesRef.current) return;

        const bounds = map.getBounds();
        if (!bounds) return;

        try {
            setZonesLoading(true);
            setZonesError(null);

            const includeInactive = showCandidateRef.current || showSuppressedRef.current;
            const zones = await riskZoneService.listInBounds(bounds, includeInactive);
            const visibleZones = zones.filter(isZoneVisible);

            map.clearAllZones();
            visibleZones.forEach((z) => {
                const baseColor = zoneLevelColor(z.level);
                const dashArray = z.status === 'candidate' || z.status === 'suppressed' ? '6 6' : undefined;
                // Higher opacity so zones read clearly on all basemaps (incl. satellite).
                const fillOpacity = z.status === 'verified' || z.status === 'locked' ? 0.22 : 0.12;
                const color = z.status === 'suppressed' ? '#94a3b8' : baseColor;
                const statusLabel = z.status.toUpperCase();
                const levelLabel = z.level === 'high_risk' ? 'HIGH RISK' : z.level.toUpperCase();

                map.addZoneCircle({
                    id: `rz:${z.id}`,
                    lat: z.center_lat,
                    lng: z.center_lon,
                    radiusMeters: z.radius_meters,
                    color,
                    fillColor: color,
                    fillOpacity,
                    dashArray,
                    popupHtml: `
                      <div style="font-size: 12px; width: 280px; line-height: 1.4; font-family: 'Inter', system-ui, sans-serif;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; padding-bottom:8px; border-bottom: 1px solid #e2e8f0;">
                          <strong style="font-size: 14px; color: #1e293b;">Risk Zone</strong>
                          <span style="padding: 3px 10px; border-radius: 999px; background: ${color}15; color: ${color}; font-weight: 700; font-size: 10px; letter-spacing: 0.5px;">${levelLabel}</span>
                        </div>
                        <div style="color: #475569; display: grid; gap: 6px;">
                          <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Status</span> <strong>${statusLabel}</strong></div>
                          <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Risk Score</span> <strong>${Number(z.score).toFixed(2)}</strong></div>
                          <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Reports</span> <strong>${z.report_count}</strong> (${z.verified_count} verified)</div>
                          <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Radius</span> <strong>${Math.round(z.radius_meters)} m</strong></div>
                        </div>
                        <div style="margin-top:10px; padding-top:8px; border-top: 1px solid #e2e8f0; color:#94a3b8; font-size:11px;">
                          Last updated ${new Date(z.calculated_at).toLocaleString()}
                        </div>
                      </div>
                    `,
                });
            });

            setZoneCount(visibleZones.length);
        } catch (e) {
            console.error(e);
            setZonesError('Failed to load risk zones.');
            mapRef.current?.clearAllZones();
        } finally {
            setZonesLoading(false);
        }
    };

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (!isSupabaseConfigured()) return;

        if (!showZones) {
            map.clearAllZones();
            setZoneCount(0);
            return;
        }

        void loadZonesForCurrentBounds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showZones, showCandidateZones, showSuppressedZones]);

    const scheduleZonesRefresh = () => {
        if (zonesRefreshTimerRef.current !== null) {
            window.clearTimeout(zonesRefreshTimerRef.current);
        }
        zonesRefreshTimerRef.current = window.setTimeout(() => {
            zonesRefreshTimerRef.current = null;
            void loadZonesForCurrentBounds();
        }, 350);
    };

    useEffect(() => {
        if (!isSupabaseConfigured()) return;
        riskZoneService.isAdmin().then((v) => setIsAdmin(v)).catch(() => setIsAdmin(false));
    }, []);

    useEffect(() => {
        loadLiveReports();
        if (!isSupabaseConfigured()) return;

        const hazardChannel = hazardService.subscribeToReports((newReport) => {
            mapRef.current?.removeMarker(newReport.id);
            mapRef.current?.addMarker(toMarker(newReport));
        });

        const advisoryChannel = advisoryService.subscribeToAdvisories({
            onInsert: (advisory) => {
                if (advisory.latitude === null || advisory.longitude === null) return;
                mapRef.current?.removeMarker(`adv:${advisory.id}`);
                mapRef.current?.addMarker(toAdvisoryMarker(advisory));
            },
            onUpdate: (advisory) => {
                const markerId = `adv:${advisory.id}`;
                if (advisory.latitude === null || advisory.longitude === null) {
                    mapRef.current?.removeMarker(markerId);
                    return;
                }
                mapRef.current?.removeMarker(markerId);
                mapRef.current?.addMarker(toAdvisoryMarker(advisory));
            },
            onDelete: (id) => {
                mapRef.current?.removeMarker(`adv:${id}`);
            },
        });

        const riskZoneChannel = riskZoneService.subscribeToRiskZones({
            onInsert: () => { if (showZonesRef.current) scheduleZonesRefresh(); },
            onUpdate: () => { if (showZonesRef.current) scheduleZonesRefresh(); },
            onDelete: () => { if (showZonesRef.current) scheduleZonesRefresh(); },
        });

        return () => {
            hazardChannel.unsubscribe();
            advisoryChannel.unsubscribe();
            riskZoneChannel.unsubscribe();
            if (zonesRefreshTimerRef.current !== null) window.clearTimeout(zonesRefreshTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void loadMonitoringZones();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!showZones) {
            mapRef.current?.clearAllZones();
            setZoneCount(0);
            return;
        }
        void loadZonesForCurrentBounds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showZones, showCandidateZones, showSuppressedZones]);

    const handleRecenter = () => {
        mapRef.current?.panToLocation(13.08, 80.27, 6);
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            position: 'relative',
        }}>
            {/* Premium Header */}
            <Box
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: 1.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    backdropFilter: 'blur(20px)',
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        {/* Logo/Title */}
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                            }}
                        >
                            <SatelliteAltIcon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, letterSpacing: -0.5 }}>
                                Live Map
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.3 }}>
                                Real-time hazard monitoring
                            </Typography>
                        </Box>

                    </Stack>

                    {/* Right Actions */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        {/* Stats Chips */}
                        <Chip
                            icon={<PlaceIcon sx={{ fontSize: 16 }} />}
                            label={`${markerCount} reports`}
                            size="small"
                            sx={{
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                color: theme.palette.error.main,
                                fontWeight: 600,
                                fontSize: 11,
                                '& .MuiChip-icon': { color: 'inherit' },
                            }}
                        />
                        {showZones && (
                            <Chip
                                icon={<LayersIcon sx={{ fontSize: 16 }} />}
                                label={`${zoneCount} risk zones`}
                                size="small"
                                sx={{
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    color: theme.palette.info.main,
                                    fontWeight: 600,
                                    fontSize: 11,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                        )}
                        {showMonitoringZones && (
                            <Chip
                                icon={<GridViewIcon sx={{ fontSize: 16 }} />}
                                label={`${monitoringZonesCount} monitoring zones`}
                                size="small"
                                sx={{
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    color: theme.palette.success.main,
                                    fontWeight: 600,
                                    fontSize: 11,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                        )}

                        <Tooltip title="Toggle layer controls">
                            <IconButton
                                size="small"
                                onClick={() => setShowFilters(!showFilters)}
                                sx={{
                                    bgcolor: showFilters ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                    color: showFilters ? 'primary.main' : 'text.secondary',
                                }}
                            >
                                <TuneIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Recenter map">
                            <IconButton size="small" onClick={handleRecenter}>
                                <MyLocationIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={loading ? null : <RefreshIcon />}
                            onClick={async () => {
                                await loadLiveReports();
                                await loadMonitoringZones();
                            }}
                            disabled={loading}
                            sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: alpha(theme.palette.divider, 0.3),
                            }}
                        >
                            {loading ? 'Loading…' : 'Refresh'}
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            {/* Error Alerts */}
            {(error || zonesError) && (
                <Box sx={{ px: 3, pt: 2 }}>
                    {error && (
                        <Alert
                            severity="error"
                            onClose={() => setError(null)}
                            sx={{ mb: 1, borderRadius: '12px' }}
                        >
                            {error}
                        </Alert>
                    )}
                    {zonesError && (
                        <Alert
                            severity="warning"
                            onClose={() => setZonesError(null)}
                            sx={{ borderRadius: '12px' }}
                        >
                            {zonesError}
                        </Alert>
                    )}
                </Box>
            )}

            {/* Map Container */}
            <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 2 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: '20px',
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
                        position: 'relative',
                    }}
                >
                    <LeafletMap
                        ref={mapRef}
                        height="calc(100vh - 180px)"
                        zoom={6}
                        center={[13.08, 80.27]}
                        zoneReviewMode={showZones}
                        showMonitoringZones={showMonitoringZones}
                        monitoringEditEnabled={monitoringEditEnabled}
                        onMonitoringZoneCreateRequested={(params) => {
                            pendingMonitoringRef.current = params;
                            setNewZoneName('');
                            setNameDialogOpen(true);
                        }}
                        onMonitoringZoneEdited={async (params) => {
                            try {
                                await monitoringZoneService.update(params.zoneId, {
                                    center_lat: params.center_lat,
                                    center_lng: params.center_lng,
                                    radius_meters: params.radius_meters,
                                });
                            } catch (e) {
                                console.error(e);
                                setError(`Failed to update monitoring zone: ${formatRpcError(e)}`);
                            }
                        }}
                        onMonitoringZoneDeleted={async (params) => {
                            try {
                                await monitoringZoneService.delete(params.zoneId);
                                void loadMonitoringZones();
                            } catch (e) {
                                console.error(e);
                                setError(`Failed to delete monitoring zone: ${formatRpcError(e)}`);
                            }
                        }}
                        onMapReady={(map) => {
                            if (showZonesRef.current) scheduleZonesRefresh();
                            if (zoneMoveHandlerBoundRef.current) return;
                            zoneMoveHandlerBoundRef.current = true;
                            const onViewportChanged = () => {
                                if (!showZonesRef.current) return;
                                scheduleZonesRefresh();
                            };
                            map.on('moveend', onViewportChanged);
                            map.on('zoomend', onViewportChanged);
                        }}
                    />

                    {/* Floating Controls */}
                    <Fade in={showFilters}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 14,
                                left: 14,
                                zIndex: 600,
                                width: { xs: 'calc(100% - 28px)', sm: 360 },
                                pointerEvents: 'none',
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    borderRadius: '16px',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                    bgcolor: alpha(theme.palette.background.paper, 0.92),
                                    backdropFilter: 'blur(14px)',
                                    boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.12)}`,
                                    pointerEvents: 'auto',
                                }}
                            >
                                <Stack spacing={1.2}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography variant="body2" fontWeight={800} sx={{ letterSpacing: 0.2 }}>
                                            Layers
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={showZones ? 'Zone Review' : 'Live Markers'}
                                            sx={{
                                                height: 22,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                bgcolor: showZones ? alpha(theme.palette.info.main, 0.12) : alpha(theme.palette.grey[500], 0.12),
                                                color: showZones ? theme.palette.info.main : theme.palette.text.secondary,
                                            }}
                                        />
                                    </Stack>

                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                                        <FormControlLabel
                                            sx={{ mr: 1 }}
                                            control={
                                                <Switch
                                                    checked={showZones}
                                                    onChange={(_, v) => setShowZones(v)}
                                                    size="small"
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <LayersIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" fontWeight={600}>Risk Zones</Typography>
                                                </Stack>
                                            }
                                        />

                                        <FormControlLabel
                                            sx={{ mr: 1 }}
                                            control={
                                                <Switch
                                                    checked={showMonitoringZones}
                                                    onChange={(_, v) => {
                                                        setShowMonitoringZones(v);
                                                        if (!v) setMonitoringEditEnabled(false);
                                                    }}
                                                    size="small"
                                                    color="success"
                                                />
                                            }
                                            label={
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <GridViewIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" fontWeight={600}>Monitoring</Typography>
                                                </Stack>
                                            }
                                        />
                                    </Stack>

                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                                        <FormControlLabel
                                            sx={{ mr: 1 }}
                                            control={
                                                <Switch
                                                    checked={monitoringEditEnabled}
                                                    onChange={(_, v) => setMonitoringEditEnabled(v)}
                                                    size="small"
                                                    disabled={!showMonitoringZones}
                                                />
                                            }
                                            label={
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color={!showMonitoringZones ? 'text.disabled' : 'text.primary'}
                                                >
                                                    Edit Monitoring
                                                </Typography>
                                            }
                                        />

                                        <FormControlLabel
                                            sx={{ mr: 1 }}
                                            control={
                                                <Switch
                                                    checked={showCandidateZones}
                                                    onChange={(_, v) => setShowCandidateZones(v)}
                                                    size="small"
                                                    disabled={!showZones}
                                                />
                                            }
                                            label={
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color={!showZones ? 'text.disabled' : 'text.primary'}
                                                >
                                                    Candidates
                                                </Typography>
                                            }
                                        />

                                        <FormControlLabel
                                            sx={{ mr: 0 }}
                                            control={
                                                <Switch
                                                    checked={showSuppressedZones}
                                                    onChange={(_, v) => setShowSuppressedZones(v)}
                                                    size="small"
                                                    disabled={!showZones}
                                                />
                                            }
                                            label={
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color={!showZones ? 'text.disabled' : 'text.primary'}
                                                >
                                                    Suppressed
                                                </Typography>
                                            }
                                        />
                                    </Stack>

                                    {/* Legend */}
                                    <Box
                                        sx={{
                                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                            pt: 1,
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.4 }}>
                                            LEGEND
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.75} sx={{ mt: 0.6 }}>
                                            <Chip
                                                size="small"
                                                label="High Risk"
                                                sx={{
                                                    height: 22,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    bgcolor: alpha('#ef4444', 0.12),
                                                    color: '#ef4444',
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label="Caution"
                                                sx={{
                                                    height: 22,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    bgcolor: alpha('#eab308', 0.14),
                                                    color: '#a16207',
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label="Low"
                                                sx={{
                                                    height: 22,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    bgcolor: alpha('#22c55e', 0.14),
                                                    color: '#16a34a',
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label="MANUAL"
                                                variant="outlined"
                                                sx={{
                                                    height: 22,
                                                    fontSize: 11,
                                                    fontWeight: 800,
                                                    borderColor: alpha(theme.palette.success.main, 0.5),
                                                    color: theme.palette.success.main,
                                                }}
                                            />
                                        </Stack>
                                    </Box>

                                    {isAdmin && (
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{
                                                pt: 0.8,
                                                borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="secondary"
                                                disabled={mockBusy}
                                                onClick={async () => {
                                                    try {
                                                        setMockBusy(true);
                                                        await hazardService.seedMockReports({ clusters: 3, reportsPerCluster: 30, ageMinutes: 45 });
                                                        try {
                                                            await riskZoneService.recompute();
                                                        } catch (e) {
                                                            console.error(e);
                                                            setError(`Seeded reports, but zone generation failed: ${formatRpcError(e)}. This usually means a missing DB migration (uuid defaults / pgcrypto).`);
                                                        }
                                                        await loadLiveReports();
                                                        scheduleZonesRefresh();
                                                    } catch (e) {
                                                        setError(`Failed to seed: ${formatRpcError(e)}`);
                                                    } finally {
                                                        setMockBusy(false);
                                                    }
                                                }}
                                                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, flex: 1 }}
                                            >
                                                {mockBusy ? 'Seeding…' : 'Seed Mock'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="secondary"
                                                disabled={mockBusy}
                                                onClick={async () => {
                                                    try {
                                                        setMockBusy(true);
                                                        await hazardService.clearMockReports();
                                                        await loadLiveReports();
                                                        scheduleZonesRefresh();
                                                    } catch (e) {
                                                        setError(`Failed to clear: ${formatRpcError(e)}`);
                                                    } finally {
                                                        setMockBusy(false);
                                                    }
                                                }}
                                                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, flex: 1 }}
                                            >
                                                Clear
                                            </Button>
                                        </Stack>
                                    )}
                                </Stack>
                            </Paper>
                        </Box>
                    </Fade>
                </Paper>
            </Box>

            <Dialog open={nameDialogOpen} onClose={() => {
                const pending = pendingMonitoringRef.current;
                if (pending) mapRef.current?.discardPendingMonitoringZone(pending.tempLayerId);
                pendingMonitoringRef.current = null;
                setNameDialogOpen(false);
            }}>
                <DialogTitle>Name monitoring zone</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Give this manually drawn zone a name. It will be saved and editable.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Zone name"
                        fullWidth
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        placeholder="e.g. Marina Beach"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        const pending = pendingMonitoringRef.current;
                        if (pending) mapRef.current?.discardPendingMonitoringZone(pending.tempLayerId);
                        pendingMonitoringRef.current = null;
                        setNameDialogOpen(false);
                    }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            const pending = pendingMonitoringRef.current;
                            if (!pending) return;
                            const name = newZoneName.trim() || 'Monitoring Zone';
                            try {
                                const created = await monitoringZoneService.create({
                                    name,
                                    center_lat: pending.center_lat,
                                    center_lng: pending.center_lng,
                                    radius_meters: pending.radius_meters,
                                });
                                mapRef.current?.finalizeMonitoringZone(pending.tempLayerId, created as MonitoringZone);
                                pendingMonitoringRef.current = null;
                                setNameDialogOpen(false);
                                void loadMonitoringZones();
                            } catch (e) {
                                console.error(e);
                                setError(`Failed to save monitoring zone: ${formatRpcError(e)}`);
                            }
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Loading Indicator */}
            <Fade in={loading || zonesLoading}>
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: 'white',
                        px: 3,
                        py: 1.5,
                        borderRadius: '12px',
                        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.15)}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        zIndex: 1000,
                    }}
                >
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.3 },
                            },
                        }}
                    />
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {loading ? 'Loading reports…' : 'Loading zones…'}
                    </Typography>
                </Box>
            </Fade>
        </Box>
    );
};

export default MapView;
