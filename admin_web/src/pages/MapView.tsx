import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Paper, Stack, Typography, Button, Alert, Tabs, Tab, FormControlLabel, Switch } from '@mui/material';

import LeafletMapWithDraw from '../components/LeafletMapWithDraw';
import LeafletMap, { type MapMethods } from '../components/LeafletMap';
import { hazardService } from '../services/hazardService';
import { advisoryService } from '../services/advisoryService';
import { riskZoneService } from '../services/riskZoneService';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { HazardReport } from '../types/hazard';
import type { OfficialAdvisory } from '../types/advisory';
import type { GeneratedRiskZone } from '../types/riskZone';
import { useSearchParams } from 'react-router-dom';

/**
 * MapView Page
 * Tabs:
 * - Live Reports: hazard report markers
 * - Zones: monitoring zone visualization and management
 */
export const MapView: React.FC = () => {
    const mapRef = useRef<MapMethods | null>(null);
    const [tab, setTab] = useState<'live' | 'zones'>('live');
    const [loading, setLoading] = useState(false);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [zonesError, setZonesError] = useState<string | null>(null);
    const [searchParams] = useSearchParams();

    const [showZones, setShowZones] = useState(true);
    const [showCandidateZones, setShowCandidateZones] = useState(false);
    const [showSuppressedZones, setShowSuppressedZones] = useState(false);

    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [mockBusy, setMockBusy] = useState(false);

    const formatRpcError = (e: unknown) => {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;
        if (e instanceof Error) return e.message;

        // Supabase errors often look like { message, details, hint, code }
        const anyE = e as any;
        const msg = anyE?.message || anyE?.error_description || anyE?.error || 'Unknown error';
        const code = anyE?.code ? `code=${anyE.code}` : null;
        const details = anyE?.details ? `details=${anyE.details}` : null;
        const hint = anyE?.hint ? `hint=${anyE.hint}` : null;
        return [msg, code, details, hint].filter(Boolean).join(' • ');
    };

    const zonesRefreshTimerRef = useRef<number | null>(null);
    const zoneMoveHandlerBoundRef = useRef(false);

    const showZonesRef = useRef(showZones);
    const showCandidateRef = useRef(showCandidateZones);
    const showSuppressedRef = useRef(showSuppressedZones);

    useEffect(() => {
        showZonesRef.current = showZones;
    }, [showZones]);
    useEffect(() => {
        showCandidateRef.current = showCandidateZones;
    }, [showCandidateZones]);
    useEffect(() => {
        showSuppressedRef.current = showSuppressedZones;
    }, [showSuppressedZones]);

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

            advisories
                .filter((a) => a.latitude !== null && a.longitude !== null)
                .forEach((a) => mapRef.current?.addMarker(toAdvisoryMarker(a)));

            if (showZonesRef.current) {
                // Best-effort; map overlay should not block marker refresh.
                void loadZonesForCurrentBounds();
            }

            // Focus on a specific report/location if requested.
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

    const zoneLevelColor = (level: GeneratedRiskZone['level']) => {
        if (level === 'high_risk') return '#ef4444';
        if (level === 'caution') return '#f59e0b';
        return '#0ea5e9';
    };

    const isZoneVisible = (z: GeneratedRiskZone) => {
        if (z.status === 'verified' || z.status === 'locked') return true;
        if (z.status === 'candidate') return showCandidateRef.current;
        if (z.status === 'suppressed') return showSuppressedRef.current;
        return false;
    };

    const loadZonesForCurrentBounds = async () => {
        if (!isSupabaseConfigured()) return;
        if (!mapRef.current) return;
        if (!showZonesRef.current) return;

        const bounds = mapRef.current.getBounds();
        if (!bounds) return;

        try {
            setZonesLoading(true);
            setZonesError(null);

            const zones = await riskZoneService.listInBounds(bounds, false);

            mapRef.current.clearAllZones();
            zones.filter(isZoneVisible).forEach((z) => {
                const baseColor = zoneLevelColor(z.level);
                const dashArray = z.status === 'candidate' || z.status === 'suppressed' ? '6 6' : undefined;
                const fillOpacity = z.status === 'verified' || z.status === 'locked' ? 0.12 : 0.05;
                const color = z.status === 'suppressed' ? '#94a3b8' : baseColor;
                const statusLabel = z.status.toUpperCase();
                const levelLabel = z.level === 'high_risk' ? 'HIGH RISK' : z.level.toUpperCase();

                mapRef.current?.addZoneCircle({
                    id: `rz:${z.id}`,
                    lat: z.center_lat,
                    lng: z.center_lon,
                    radiusMeters: z.radius_meters,
                    color,
                    fillColor: color,
                    fillOpacity,
                    dashArray,
                    popupHtml: `
                      <div style="font-size: 12px; width: 260px; line-height: 1.35; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
                          <strong style="font-size: 13px;">Generated Zone</strong>
                          <span style="padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.08); background: rgba(255,255,255,0.85); color: ${color}; font-weight: 800; font-size: 11px;">${levelLabel}</span>
                        </div>
                        <div style="color: #475569;">
                          <div><span style="color:#64748b">Status:</span> ${statusLabel}</div>
                          <div><span style="color:#64748b">Score:</span> ${Number(z.score).toFixed(2)}</div>
                          <div><span style="color:#64748b">Reports:</span> ${z.report_count} (verified ${z.verified_count})</div>
                          <div><span style="color:#64748b">Radius:</span> ${Math.round(z.radius_meters)} m</div>
                          <div style="margin-top:6px; color:#64748b; font-size:11px;">Updated ${new Date(z.calculated_at).toLocaleString()}</div>
                        </div>
                      </div>
                    `,
                });
            });
        } catch (e) {
            console.error(e);
            setZonesError(
                'Failed to load generated zones. (Tip: ensure your user is in app_roles as admin, and that the migration is applied.)'
            );
            // If we can't load zones, avoid leaving stale overlays.
            mapRef.current?.clearAllZones();
        } finally {
            setZonesLoading(false);
        }
    };

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
        riskZoneService
            .isAdmin()
            .then((v) => setIsAdmin(v))
            .catch(() => setIsAdmin(false));
        // Subscribe once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // If a focus param is present, ensure the Live tab is active.
    useEffect(() => {
        if (focus.reportId || (focus.lat !== null && focus.lng !== null)) {
            setTab('live');
        }
    }, [focus]);

    // Load markers on mount and keep updated.
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
            onInsert: () => {
                if (!showZonesRef.current) return;
                scheduleZonesRefresh();
            },
            onUpdate: () => {
                if (!showZonesRef.current) return;
                scheduleZonesRefresh();
            },
            onDelete: () => {
                if (!showZonesRef.current) return;
                scheduleZonesRefresh();
            },
        });

        return () => {
            hazardChannel.unsubscribe();
            advisoryChannel.unsubscribe();
            riskZoneChannel.unsubscribe();
            if (zonesRefreshTimerRef.current !== null) {
                window.clearTimeout(zonesRefreshTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When switching to live tab, ensure Leaflet recalculates size.
    useEffect(() => {
        if (tab !== 'live') return;
        mapRef.current?.handleTabVisible();
        if (showZonesRef.current) {
            void loadZonesForCurrentBounds();
        }
    }, [tab]);

    // When zone visibility toggles change, refresh overlays.
    useEffect(() => {
        if (tab !== 'live') return;

        if (!showZones) {
            mapRef.current?.clearAllZones();
            return;
        }

        void loadZonesForCurrentBounds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showZones, showCandidateZones, showSuppressedZones]);

    return (
        <Box>
            {/* Header removed */}

            <Paper elevation={1} sx={{ p: 1.5, mt: 2, borderRadius: 2 }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab value="live" label="Live Reports" />
                    <Tab value="zones" label="Monitoring Zones" />
                </Tabs>
            </Paper>

            {tab === 'live' && (
                <Box sx={{ width: '100%', mt: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {zonesError && (
                        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setZonesError(null)}>
                            {zonesError}
                        </Alert>
                    )}

                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Button variant="outlined" onClick={loadLiveReports} disabled={loading}>
                            {loading ? 'Refreshing…' : 'Refresh Markers'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={loadZonesForCurrentBounds}
                            disabled={!showZones || zonesLoading}
                        >
                            {zonesLoading ? 'Loading Zones…' : 'Refresh Zones'}
                        </Button>
                        {isAdmin && (
                            <>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    disabled={mockBusy}
                                    onClick={async () => {
                                        try {
                                            setMockBusy(true);
                                            await hazardService.seedMockReports({
                                                clusters: 3,
                                                reportsPerCluster: 30,
                                                ageMinutes: 45,
                                            });
                                            // Generate candidate zones immediately.
                                            try {
                                                await riskZoneService.recompute();
                                            } catch (e) {
                                                console.error('Zone recompute after seeding failed:', e);
                                            }
                                            await loadLiveReports();
                                            scheduleZonesRefresh();
                                        } catch (e) {
                                            console.error(e);
                                            setError(`Failed to seed mock reports: ${formatRpcError(e)}`);
                                        } finally {
                                            setMockBusy(false);
                                        }
                                    }}
                                >
                                    {mockBusy ? 'Seeding…' : 'Seed Mock Reports'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    disabled={mockBusy}
                                    onClick={async () => {
                                        try {
                                            setMockBusy(true);
                                            await hazardService.clearMockReports();
                                            await loadLiveReports();
                                            scheduleZonesRefresh();
                                        } catch (e) {
                                            console.error(e);
                                            setError(`Failed to clear mock reports: ${formatRpcError(e)}`);
                                        } finally {
                                            setMockBusy(false);
                                        }
                                    }}
                                >
                                    {mockBusy ? 'Clearing…' : 'Clear Mock Reports'}
                                </Button>
                            </>
                        )}
                        <FormControlLabel
                            control={<Switch checked={showZones} onChange={(_, v) => setShowZones(v)} />}
                            label="Show Zones"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showCandidateZones}
                                    onChange={(_, v) => setShowCandidateZones(v)}
                                    disabled={!showZones}
                                />
                            }
                            label="Candidates"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showSuppressedZones}
                                    onChange={(_, v) => setShowSuppressedZones(v)}
                                    disabled={!showZones}
                                />
                            }
                            label="Suppressed"
                        />
                        <Typography variant="body2" color="text.secondary">
                            Showing up to 200 latest reports
                        </Typography>
                    </Stack>

                    <LeafletMap
                        ref={mapRef}
                        height="calc(100vh - 260px)"
                        zoom={6}
                        center={[13.08, 80.27]}
                        onMapReady={(map) => {
                            // Load zones after the map is interactive, and refresh on pan/zoom.
                            if (showZonesRef.current) {
                                scheduleZonesRefresh();
                            }

                            // Guard in case onMapReady is ever called again.
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
                </Box>
            )}

            {tab === 'zones' && (
                <Box sx={{ width: '100%', mt: 2 }}>
                    <LeafletMapWithDraw
                        height="calc(100vh - 260px)"
                        zoom={6}
                        center={[13.08, 80.27]}
                    />
                </Box>
            )}
        </Box>
    );
};

export default MapView;
