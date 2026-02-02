import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    GoogleMap,
    DrawingManager,
    Circle,
    InfoWindow,
    useJsApiLoader,
} from '@react-google-maps/api';
import { Box, Alert, AlertTitle, CircularProgress, Button, Stack, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { supabase, isSupabaseConfigured } from '../core/supabase_config';

// Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Libraries needed for Drawing
const libraries: ('drawing' | 'geometry')[] = ['drawing', 'geometry'];

// Map container style
const mapContainerStyle = {
    width: '100%',
    height: '700px',
};

// Default center: India's coastline (Chennai area)
const defaultCenter = {
    lat: 13.08,
    lng: 80.27,
};

// Default zoom level
const defaultZoom = 6;

// Zone interface matching Supabase schema
export interface MonitoringZone {
    id?: string;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
    created_at?: string;
}

interface GoogleMapDashboardProps {
    height?: string;
    onZoneCreated?: (zone: MonitoringZone) => void;
    onZoneDeleted?: (zoneId: string) => void;
}

const GoogleMapDashboard: React.FC<GoogleMapDashboardProps> = ({
    height = '700px',
    onZoneCreated,
    onZoneDeleted,
}) => {
    const [zones, setZones] = useState<MonitoringZone[]>([]);
    const [selectedZone, setSelectedZone] = useState<MonitoringZone | null>(null);
    const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);
    const [supabaseStatus, setSupabaseStatus] = useState<{
        configured: boolean;
        message: string;
    }>({ configured: false, message: '' });

    const mapRef = useRef<google.maps.Map | null>(null);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

    // Load Google Maps API
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    // Check Supabase configuration on mount
    useEffect(() => {
        const configured = isSupabaseConfigured();
        setSupabaseStatus({
            configured,
            message: configured
                ? 'Supabase connected - zones will be saved'
                : 'Supabase not configured - zones will not persist',
        });
    }, []);

    // Fetch existing zones from Supabase on mount
    useEffect(() => {
        const fetchZones = async () => {
            if (!isSupabaseConfigured()) {
                console.warn('⚠️ Supabase not configured - skipping zone fetch');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('monitoring_zones')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('❌ Error fetching zones:', error.message);
                    return;
                }

                if (data) {
                    console.log(`✅ Loaded ${data.length} zones from Supabase`);
                    setZones(data);
                }
            } catch (err) {
                console.error('❌ Unexpected error fetching zones:', err);
            }
        };

        fetchZones();
    }, []);

    // Handle map load
    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        console.log('✅ Google Map loaded successfully');
    }, []);

    // Handle circle complete (when user finishes drawing)
    const onCircleComplete = useCallback(
        async (circle: google.maps.Circle) => {
            const center = circle.getCenter();
            const radius = circle.getRadius();

            if (!center) {
                console.error('❌ Circle has no center');
                return;
            }

            const newZone: MonitoringZone = {
                center_lat: center.lat(),
                center_lng: center.lng(),
                radius_meters: Math.round(radius),
            };

            console.log('🎯 Circle drawn:', newZone);

            // Remove the drawn circle (we'll render it via state)
            circle.setMap(null);

            // Save to Supabase if configured
            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('monitoring_zones')
                        .insert([newZone])
                        .select();

                    if (error) {
                        console.error('❌ Error saving zone to Supabase:', error.message);
                        alert(`Failed to save zone: ${error.message}`);
                        return;
                    }

                    if (data && data.length > 0) {
                        const savedZone = data[0];
                        console.log('✅ Zone saved to Supabase:', savedZone);
                        setZones((prev) => [...prev, savedZone]);

                        // Notify parent component
                        if (onZoneCreated) {
                            onZoneCreated(savedZone);
                        }
                    }
                } catch (err) {
                    console.error('❌ Unexpected error saving zone:', err);
                    alert('Failed to save zone - check console for details');
                }
            } else {
                // If Supabase not configured, just add to local state
                console.warn('⚠️ Supabase not configured - zone not saved');
                const localZone = { ...newZone, id: `local_${Date.now()}` };
                setZones((prev) => [...prev, localZone]);
                alert('Zone drawn but NOT saved (Supabase not configured)');
            }

            // Reset drawing mode to allow drawing another circle
            setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
        },
        [onZoneCreated]
    );

    // Handle zone deletion
    const handleDeleteZone = async (zone: MonitoringZone) => {
        if (!zone.id) {
            console.error('❌ Cannot delete zone without ID');
            return;
        }

        if (!window.confirm(`Delete this monitoring zone?\n\nRadius: ${zone.radius_meters}m`)) {
            return;
        }

        // Delete from Supabase if configured
        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('monitoring_zones')
                    .delete()
                    .eq('id', zone.id);

                if (error) {
                    console.error('❌ Error deleting zone from Supabase:', error.message);
                    alert(`Failed to delete zone: ${error.message}`);
                    return;
                }

                console.log('✅ Zone deleted from Supabase');
            } catch (err) {
                console.error('❌ Unexpected error deleting zone:', err);
                alert('Failed to delete zone - check console');
                return;
            }
        }

        // Remove from local state
        setZones((prev) => prev.filter((z) => z.id !== zone.id));
        setSelectedZone(null);

        // Notify parent component
        if (onZoneDeleted && zone.id) {
            onZoneDeleted(zone.id);
        }

        console.log('🗑️ Zone removed from map');
    };

    // Handle drawing manager load
    const onDrawingManagerLoad = useCallback(
        (drawingManager: google.maps.drawing.DrawingManager) => {
            drawingManagerRef.current = drawingManager;
            console.log('✅ Drawing Manager loaded');
        },
        []
    );

    // Toggle drawing mode
    const toggleDrawingMode = () => {
        if (drawingMode === null) {
            setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
        } else {
            setDrawingMode(null);
        }
    };

    // Clear all zones (local only - does not delete from Supabase)
    const clearLocalZones = () => {
        if (window.confirm('Clear all zones from map? (Does not delete from database)')) {
            setZones([]);
            setSelectedZone(null);
        }
    };

    // Format distance for display
    const formatRadius = (meters: number): string => {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(2)} km`;
        }
        return `${meters} m`;
    };

    // Render loading state
    if (!isLoaded) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: height,
                    backgroundColor: '#f5f5f5',
                    borderRadius: '12px',
                }}
            >
                <Stack spacing={2} alignItems="center">
                    <CircularProgress />
                    <Box sx={{ color: '#64748B' }}>Loading Google Maps...</Box>
                </Stack>
            </Box>
        );
    }

    // Render error state
    if (loadError) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">
                    <AlertTitle>Google Maps Load Error</AlertTitle>
                    {loadError.message || 'Failed to load Google Maps'}
                    <br />
                    <br />
                    <strong>Check:</strong>
                    <ul>
                        <li>VITE_GOOGLE_MAPS_API_KEY is set in .env.local</li>
                        <li>API key is valid and has Maps JavaScript API enabled</li>
                        <li>Drawing Library is enabled for this API key</li>
                    </ul>
                </Alert>
            </Box>
        );
    }

    // Render map
    return (
        <Box>
            {/* Supabase Status Alert */}
            {!supabaseStatus.configured && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>⚠️ Supabase Not Configured</AlertTitle>
                    {supabaseStatus.message}. Zones will not persist across page reloads.
                    <br />
                    <strong>Set these in .env.local:</strong>
                    <br />
                    - VITE_SUPABASE_URL
                    <br />
                    - VITE_SUPABASE_ANON_KEY
                </Alert>
            )}

            {/* Map Controls */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                    variant={drawingMode ? 'contained' : 'outlined'}
                    onClick={toggleDrawingMode}
                    sx={{
                        backgroundColor: drawingMode ? '#2563eb' : 'transparent',
                        color: drawingMode ? '#FFFFFF' : '#2563eb',
                        borderColor: '#2563eb',
                        '&:hover': {
                            backgroundColor: drawingMode ? '#1d4ed8' : '#eff6ff',
                        },
                    }}
                >
                    {drawingMode ? '🎯 Drawing Mode: ON' : '🎯 Enable Drawing'}
                </Button>
                <Button
                    variant="outlined"
                    onClick={clearLocalZones}
                    disabled={zones.length === 0}
                    sx={{
                        borderColor: '#e2e8f0',
                        color: '#475569',
                        '&:hover': {
                            backgroundColor: '#f8fafc',
                            borderColor: '#cbd5e1',
                        },
                    }}
                >
                    🗑️ Clear All ({zones.length})
                </Button>
            </Stack>

            {/* Google Map */}
            <Box
                sx={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
            >
                <GoogleMap
                    mapContainerStyle={{ ...mapContainerStyle, height }}
                    center={defaultCenter}
                    zoom={defaultZoom}
                    onLoad={onMapLoad}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: true,
                        fullscreenControl: true,
                        zoomControl: true,
                    }}
                >
                    {/* Drawing Manager - Only CIRCLE mode enabled */}
                    <DrawingManager
                        onLoad={onDrawingManagerLoad}
                        onCircleComplete={onCircleComplete}
                        drawingMode={drawingMode}
                        options={{
                            drawingControl: false, // We use custom button
                            circleOptions: {
                                fillColor: '#2563eb',
                                fillOpacity: 0.2,
                                strokeColor: '#2563eb',
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                clickable: false,
                                editable: false,
                                zIndex: 1,
                            },
                        }}
                    />

                    {/* Render existing zones as circles */}
                    {zones.map((zone) => (
                        <Circle
                            key={zone.id || `${zone.center_lat}_${zone.center_lng}`}
                            center={{ lat: zone.center_lat, lng: zone.center_lng }}
                            radius={zone.radius_meters}
                            options={{
                                fillColor: '#10b981',
                                fillOpacity: 0.15,
                                strokeColor: '#10b981',
                                strokeOpacity: 0.6,
                                strokeWeight: 2,
                                clickable: true,
                                editable: false,
                                zIndex: 1,
                            }}
                            onClick={() => setSelectedZone(zone)}
                        />
                    ))}

                    {/* Info Window for selected zone */}
                    {selectedZone && (
                        <InfoWindow
                            position={{
                                lat: selectedZone.center_lat,
                                lng: selectedZone.center_lng,
                            }}
                            onCloseClick={() => setSelectedZone(null)}
                        >
                            <Box sx={{ p: 1, minWidth: 200 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#0f172a' }}>
                                    📍 Monitoring Zone
                                </Typography>
                                <Box sx={{ fontSize: '0.875rem', color: '#64748b', mb: 1 }}>
                                    <strong>Center:</strong> {selectedZone.center_lat.toFixed(4)}, {selectedZone.center_lng.toFixed(4)}
                                    <br />
                                    <strong>Radius:</strong> {formatRadius(selectedZone.radius_meters)}
                                    {selectedZone.created_at && (
                                        <>
                                            <br />
                                            <strong>Created:</strong> {new Date(selectedZone.created_at).toLocaleDateString()}
                                        </>
                                    )}
                                </Box>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<DeleteOutlineIcon />}
                                    onClick={() => handleDeleteZone(selectedZone)}
                                    sx={{ mt: 1, width: '100%' }}
                                >
                                    Delete Zone
                                </Button>
                            </Box>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </Box>

            {/* Zone Count Info */}
            <Box sx={{ mt: 2, color: '#64748B', fontSize: '0.875rem' }}>
                📍 {zones.length} monitoring zone{zones.length !== 1 ? 's' : ''} on map
                {supabaseStatus.configured && ' (synced with Supabase)'}
                {!supabaseStatus.configured && ' (local only - not saved)'}
            </Box>
        </Box>
    );
};

export default GoogleMapDashboard;
