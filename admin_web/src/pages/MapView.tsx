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
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import LayersIcon from '@mui/icons-material/Layers';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import TuneIcon from '@mui/icons-material/Tune';
import PlaceIcon from '@mui/icons-material/Place';
import GridViewIcon from '@mui/icons-material/GridView';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import LeafletMap, { type MapMethods } from '../components/LeafletMap';
import { hazardService } from '../services/hazardService';
import { advisoryService } from '../services/advisoryService';
import { riskZoneService } from '../services/riskZoneService';
import { monitoringZoneService } from '../services/monitoringZoneService';
import { isSupabaseConfigured } from '../core/supabase_config';
import { exportMap } from '../services/mapExportService';
import type { HazardReport } from '../types/hazard';
import type { OfficialAdvisory } from '../types/advisory';
import type { GeneratedRiskZone } from '../types/riskZone';
import type { MonitoringZone } from '../types/monitoringZone';
import { useSearchParams } from 'react-router-dom';
import type { MonitoringZoneCoordinate } from '../types/monitoringZone';

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
    const [zoomOnLoad, setZoomOnLoad] = useState(true);

    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [mockBusy, setMockBusy] = useState(false);
    const [markerCount, setMarkerCount] = useState(0);
    const [zoneCount, setZoneCount] = useState(0);

    const [nameDialogOpen, setNameDialogOpen] = useState(false);
    const [newZoneName, setNewZoneName] = useState('');
    const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);
    const [exporting, setExporting] = useState(false);
    const initialAutoFitDoneRef = useRef(false);
    const pendingMonitoringRef = useRef<{
        tempLayerId: number;
        shape: 'circle' | 'polygon';
        center_lat: number;
        center_lng: number;
        radius_meters: number;
        polygon_points?: MonitoringZoneCoordinate[] | null;
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
    const zonesRequestIdRef = useRef(0);
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

    const hasExplicitFocus = focus.lat !== null || focus.lng !== null || Boolean(focus.reportId);

    const tryAutoFitOnOpen = (params: {
        markerPoints?: Array<[number, number]>;
        monitoringZones?: MonitoringZone[];
        riskZones?: GeneratedRiskZone[];
    }) => {
        if (initialAutoFitDoneRef.current) return;
        if (hasExplicitFocus) return;
        // When zoomOnLoad is enabled, skip auto-fit so the map stays zoomed in on the data center
        if (zoomOnLoad) {
            initialAutoFitDoneRef.current = true;
            return;
        }

        const points = params.markerPoints ?? [];
        const circles = [
            ...(params.monitoringZones ?? []).map((z) => ({
                lat: z.center_lat,
                lng: z.center_lng,
                radiusMeters: z.radius_meters,
            })),
            ...(params.riskZones ?? []).map((z) => ({
                lat: z.center_lat,
                lng: z.center_lon,
                radiusMeters: z.radius_meters,
            })),
        ];
        const polygons = (params.monitoringZones ?? [])
            .filter((z) => z.shape === 'polygon' && (z.polygon_points?.length ?? 0) >= 3)
            .map((z) => z.polygon_points ?? []);

        const didFit = mapRef.current?.fitToDataBounds({
            points,
            circles,
            polygons,
            maxZoom: 11,
        });

        if (didFit) {
            initialAutoFitDoneRef.current = true;
        }
    };

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

            const markerPoints: Array<[number, number]> = [
                ...data.map((r) => [r.latitude, r.longitude] as [number, number]),
                ...advisoriesWithLocation.map((a) => [a.latitude as number, a.longitude as number] as [number, number]),
            ];

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
            } else {
                tryAutoFitOnOpen({ markerPoints });
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
            tryAutoFitOnOpen({ monitoringZones: zones });
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

        const requestId = ++zonesRequestIdRef.current;

        try {
            setZonesLoading(true);
            setZonesError(null);

            const includeInactive = showCandidateRef.current || showSuppressedRef.current;
            const zoomLevel = map.getZoomLevel() ?? 10;
            const zones = await riskZoneService.listInBounds(bounds, includeInactive, { zoomLevel });
            if (requestId !== zonesRequestIdRef.current) return;
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
            tryAutoFitOnOpen({ riskZones: visibleZones });
        } catch (e) {
            if (requestId !== zonesRequestIdRef.current) return;
            console.error(e);
            setZonesError('Failed to load risk zones.');
            mapRef.current?.clearAllZones();
        } finally {
            if (requestId === zonesRequestIdRef.current) {
                setZonesLoading(false);
            }
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

    const handleRecenter = () => {
        mapRef.current?.panToLocation(13.08, 80.27, zoomOnLoad ? 14 : 6);
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
                    px: { xs: 2, sm: 2.5 },
                    py: 1.25,
                    background: theme.palette.background.paper,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                boxShadow: `0 3px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                        >
                            <SatelliteAltIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: '0.95rem' }}>
                                Live Map
                            </Typography>
                            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.5), fontSize: '0.65rem' }}>
                                Real-time hazard monitoring
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.75} alignItems="center">
                        {/* Stats Chips */}
                        <Chip
                            icon={<PlaceIcon sx={{ fontSize: 13 }} />}
                            label={`${markerCount} reports`}
                            size="small"
                            sx={{
                                height: 26,
                                bgcolor: alpha(theme.palette.error.main, 0.07),
                                color: alpha(theme.palette.error.main, 0.8),
                                fontWeight: 600,
                                fontSize: 10,
                                '& .MuiChip-icon': { color: 'inherit' },
                            }}
                        />
                        {showZones && (
                            <Chip
                                icon={<LayersIcon sx={{ fontSize: 13 }} />}
                                label={`${zoneCount} zones`}
                                size="small"
                                sx={{
                                    height: 26,
                                    bgcolor: alpha(theme.palette.info.main, 0.07),
                                    color: alpha(theme.palette.info.main, 0.8),
                                    fontWeight: 600,
                                    fontSize: 10,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                        )}
                        {showMonitoringZones && (
                            <Chip
                                icon={<GridViewIcon sx={{ fontSize: 13 }} />}
                                label={`${monitoringZonesCount} monitoring`}
                                size="small"
                                sx={{
                                    height: 26,
                                    bgcolor: alpha(theme.palette.success.main, 0.07),
                                    color: alpha(theme.palette.success.main, 0.8),
                                    fontWeight: 600,
                                    fontSize: 10,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                        )}

                        <Tooltip title="Layer controls" arrow>
                            <IconButton
                                size="small"
                                onClick={() => setShowFilters(!showFilters)}
                                sx={{
                                    width: 32, height: 32,
                                    borderRadius: '9px',
                                    bgcolor: showFilters ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.grey[100], 0.5),
                                    color: showFilters ? 'primary.main' : alpha(theme.palette.text.secondary, 0.6),
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' },
                                }}
                            >
                                <TuneIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Recenter" arrow>
                            <IconButton size="small" onClick={handleRecenter}
                                sx={{ width: 32, height: 32, borderRadius: '9px', bgcolor: alpha(theme.palette.grey[100], 0.5), color: alpha(theme.palette.text.secondary, 0.6), '&:hover': { color: 'primary.main' } }}>
                                <MyLocationIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                        </Tooltip>

                        {/* Export Button */}
                        <Tooltip title="Export map" arrow>
                            <span>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={exporting ? <CircularProgress size={12} color="inherit" /> : <DownloadIcon sx={{ fontSize: '0.9rem !important' }} />}
                                    onClick={(e) => setExportAnchorEl(e.currentTarget)}
                                    disabled={exporting}
                                    sx={{
                                        height: 32,
                                        borderRadius: '9px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        px: 1.5,
                                        bgcolor: 'primary.main',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        boxShadow: 'none',
                                    }}
                                >
                                    {exporting ? 'Exporting…' : 'Export'}
                                </Button>
                            </span>
                        </Tooltip>

                        {/* Export Format Menu */}
                        <Menu
                            anchorEl={exportAnchorEl}
                            open={Boolean(exportAnchorEl)}
                            onClose={() => setExportAnchorEl(null)}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            slotProps={{
                                paper: {
                                    elevation: 0,
                                    sx: { borderRadius: '12px', minWidth: 160, mt: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}` },
                                },
                            }}
                        >
                            <MenuItem
                                onClick={async () => {
                                    setExportAnchorEl(null);
                                    const container = mapRef.current?.getMapContainer();
                                    if (!container) return;
                                    setExporting(true);
                                    try {
                                        await exportMap(container, {
                                            format: 'png',
                                            title: 'ARC – Live Hazard Map',
                                            filename: `arc_map_${new Date().toISOString().slice(0, 10)}`,
                                        });
                                    } finally {
                                        setExporting(false);
                                    }
                                }}
                            >
                                <ListItemIcon><ImageIcon fontSize="small" color="primary" /></ListItemIcon>
                                <ListItemText primary="Save as PNG" secondary="High-res image" />
                            </MenuItem>
                            <MenuItem
                                onClick={async () => {
                                    setExportAnchorEl(null);
                                    const container = mapRef.current?.getMapContainer();
                                    if (!container) return;
                                    setExporting(true);
                                    try {
                                        await exportMap(container, {
                                            format: 'pdf',
                                            title: 'ARC – Live Hazard Map Snapshot',
                                            filename: `arc_map_${new Date().toISOString().slice(0, 10)}`,
                                        });
                                    } finally {
                                        setExporting(false);
                                    }
                                }}
                            >
                                <ListItemIcon><PictureAsPdfIcon fontSize="small" color="error" /></ListItemIcon>
                                <ListItemText primary="Save as PDF" secondary="A4 landscape" />
                            </MenuItem>
                        </Menu>

                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={loading ? null : <RefreshIcon sx={{ fontSize: '0.9rem !important' }} />}
                            onClick={async () => {
                                riskZoneService.clearBoundsCache();
                                await loadLiveReports();
                                await loadMonitoringZones();
                            }}
                            disabled={loading}
                            sx={{
                                height: 32,
                                borderRadius: '9px',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                px: 1.5,
                                borderColor: alpha(theme.palette.grey[300], 0.8),
                                color: alpha(theme.palette.text.primary, 0.7),
                                '&:hover': { borderColor: theme.palette.primary.main, color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.04) },
                            }}
                        >
                            {loading ? 'Loading…' : 'Refresh'}
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            {/* Error Alerts */}
            {(error || zonesError) && (
                <Box sx={{ px: 2.5, pt: 1.5 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1, borderRadius: '10px', fontSize: '0.8125rem' }}>
                            {error}
                        </Alert>
                    )}
                    {zonesError && (
                        <Alert severity="warning" onClose={() => setZonesError(null)} sx={{ borderRadius: '10px', fontSize: '0.8125rem' }}>
                            {zonesError}
                        </Alert>
                    )}
                </Box>
            )}

            {/* Map Container */}
            <Box sx={{ px: { xs: 1, sm: 2, md: 2.5 }, py: 1.5 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                        boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.04)}, 0 4px 20px ${alpha(theme.palette.common.black, 0.02)}`,
                        position: 'relative',
                    }}
                >
                    <LeafletMap
                        ref={mapRef}
                        height="calc(100vh - 180px)"
                        zoom={zoomOnLoad ? 14 : 6}
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
                                    shape: params.shape,
                                    center_lat: params.center_lat,
                                    center_lng: params.center_lng,
                                    radius_meters: params.radius_meters,
                                    polygon_points: params.polygon_points ?? null,
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
                                top: 10,
                                left: 10,
                                zIndex: 600,
                                width: { xs: 'calc(100% - 20px)', sm: 300 },
                                pointerEvents: 'none',
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 1.25,
                                    borderRadius: '12px',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                                    bgcolor: alpha(theme.palette.background.paper, 0.96),
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.06)}`,
                                    pointerEvents: 'auto',
                                }}
                            >
                                <Stack spacing={0.75}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: alpha(theme.palette.text.secondary, 0.5) }}>
                                            Layers
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={showZones ? 'Zone Review' : 'Live Markers'}
                                            sx={{
                                                height: 18,
                                                fontSize: 8,
                                                fontWeight: 700,
                                                bgcolor: showZones ? alpha(theme.palette.info.main, 0.08) : alpha(theme.palette.grey[500], 0.06),
                                                color: showZones ? alpha(theme.palette.info.main, 0.7) : alpha(theme.palette.text.secondary, 0.5),
                                            }}
                                        />
                                    </Stack>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.25, '& .MuiFormControlLabel-root': { m: 0, '& .MuiSwitch-root': { mr: 0.25 } } }}>
                                        <FormControlLabel
                                            control={<Switch checked={showZones} onChange={(_, v) => setShowZones(v)} size="small" color="primary" />}
                                            label={<Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem' }}>Risk Zones</Typography>}
                                        />
                                        <FormControlLabel
                                            control={<Switch checked={showMonitoringZones} onChange={(_, v) => { setShowMonitoringZones(v); if (!v) setMonitoringEditEnabled(false); }} size="small" color="success" />}
                                            label={<Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem' }}>Monitoring</Typography>}
                                        />
                                        <FormControlLabel
                                            control={<Switch checked={monitoringEditEnabled} onChange={(_, v) => setMonitoringEditEnabled(v)} size="small" disabled={!showMonitoringZones} />}
                                            label={<Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem', color: !showMonitoringZones ? 'text.disabled' : 'text.primary' }}>Edit</Typography>}
                                        />
                                        <FormControlLabel
                                            control={<Switch checked={showCandidateZones} onChange={(_, v) => setShowCandidateZones(v)} size="small" disabled={!showZones} />}
                                            label={<Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem', color: !showZones ? 'text.disabled' : 'text.primary' }}>Candidates</Typography>}
                                        />
                                        <FormControlLabel
                                            control={<Switch checked={showSuppressedZones} onChange={(_, v) => setShowSuppressedZones(v)} size="small" disabled={!showZones} />}
                                            label={<Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem', color: !showZones ? 'text.disabled' : 'text.primary' }}>Suppressed</Typography>}
                                        />
                                        <FormControlLabel
                                            control={<Switch checked={zoomOnLoad} onChange={(_, v) => setZoomOnLoad(v)} size="small" color="warning" />}
                                            label={<Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem' }}>Zoom</Typography>}
                                        />
                                    </Box>

                                    {/* Legend */}
                                    <Box sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`, pt: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.575rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: alpha(theme.palette.text.secondary, 0.4), mb: 0.25, display: 'block' }}>
                                            Legend
                                        </Typography>
                                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" gap={0.4}>
                                            <Chip size="small" label="High Risk"
                                                sx={{ height: 18, fontSize: 8, fontWeight: 700, bgcolor: alpha('#ef4444', 0.08), color: '#ef4444' }} />
                                            <Chip size="small" label="Caution"
                                                sx={{ height: 18, fontSize: 8, fontWeight: 700, bgcolor: alpha('#eab308', 0.1), color: '#a16207' }} />
                                            <Chip size="small" label="Low"
                                                sx={{ height: 18, fontSize: 8, fontWeight: 700, bgcolor: alpha('#22c55e', 0.1), color: '#16a34a' }} />
                                            <Chip size="small" label="Manual" variant="outlined"
                                                sx={{ height: 18, fontSize: 8, fontWeight: 700, borderColor: alpha(theme.palette.success.main, 0.3), color: alpha(theme.palette.success.main, 0.7) }} />
                                        </Stack>
                                    </Box>

                                    {isAdmin && (
                                        <Stack
                                            direction="row"
                                            spacing={0.75}
                                            sx={{ pt: 0.75, borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}` }}
                                        >
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="secondary"
                                                disabled={mockBusy}
                                                onClick={async () => {
                                                    try {
                                                        setMockBusy(true);
                                                        await hazardService.seedCuratedReports({ replaceExisting: true });
                                                        await loadLiveReports();
                                                        scheduleZonesRefresh();
                                                    } catch (e) {
                                                        setError(`Failed to seed: ${formatRpcError(e)}`);
                                                    } finally {
                                                        setMockBusy(false);
                                                    }
                                                }}
                                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', flex: 1, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                                            >
                                                {mockBusy ? 'Seeding…' : 'Seed Curated'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="secondary"
                                                disabled={mockBusy}
                                                onClick={async () => {
                                                    try {
                                                        setMockBusy(true);
                                                        await hazardService.clearCuratedSeedReports();
                                                        await loadLiveReports();
                                                        scheduleZonesRefresh();
                                                    } catch (e) {
                                                        setError(`Failed to clear: ${formatRpcError(e)}`);
                                                    } finally {
                                                        setMockBusy(false);
                                                    }
                                                }}
                                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', flex: 1 }}
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
            }} PaperProps={{ sx: { borderRadius: '14px' } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography component="span" variant="subtitle1" fontWeight={700} sx={{ fontSize: '1rem' }}>
                        {pendingMonitoringRef.current?.shape === 'polygon' ? 'Name polygon zone' : 'Name monitoring zone'}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '0.8125rem', color: alpha(theme.palette.text.secondary, 0.7), mb: 1 }}>
                        Give this zone a descriptive name. It will be saved and editable on the live map.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Zone name"
                        fullWidth
                        size="small"
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        placeholder={pendingMonitoringRef.current?.shape === 'polygon' ? 'e.g. Marina evacuation boundary' : 'e.g. Marina Beach'}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button onClick={() => {
                        const pending = pendingMonitoringRef.current;
                        if (pending) mapRef.current?.discardPendingMonitoringZone(pending.tempLayerId);
                        pendingMonitoringRef.current = null;
                        setNameDialogOpen(false);
                    }} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: alpha(theme.palette.text.secondary, 0.6) }}>Cancel</Button>
                    <Button
                        variant="contained"
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, px: 2.5, boxShadow: 'none' }}
                        onClick={async () => {
                            const pending = pendingMonitoringRef.current;
                            if (!pending) return;
                            const fallbackName = pending.shape === 'polygon' ? 'Polygon Zone' : 'Monitoring Zone';
                            const name = newZoneName.trim() || fallbackName;
                            try {
                                const created = await monitoringZoneService.create({
                                    name,
                                    shape: pending.shape,
                                    center_lat: pending.center_lat,
                                    center_lng: pending.center_lng,
                                    radius_meters: pending.radius_meters,
                                    polygon_points: pending.polygon_points ?? null,
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
                        bottom: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: alpha(theme.palette.background.paper, 0.95),
                        backdropFilter: 'blur(12px)',
                        px: 2.5,
                        py: 1,
                        borderRadius: '10px',
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.1)}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        zIndex: 1000,
                    }}
                >
                    <Box
                        sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.3 },
                            },
                        }}
                    />
                    <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.7rem' }}>
                        {loading ? 'Loading reports…' : 'Loading zones…'}
                    </Typography>
                </Box>
            </Fade>
        </Box>
    );
};

export default MapView;
