import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Stack,
  Paper,
  Typography,
  Chip,
  Snackbar,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import type { Map as LeafletMapInstance, Circle as LeafletCircle } from 'leaflet';
import { supabase, testSupabaseConnection, safeInsert, safeDelete, safeUpdate } from '../core/supabase_config';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import LayersIcon from '@mui/icons-material/Layers';

/**
 * LeafletMapWithDraw Component
 * 
 * Features:
 * - Circle Drawing & Naming
 * - Editing (Move/Resize) with Persistence
 * - Offline Mode Safety
 * - People Count Tracking with Color-Coded Zones
 */

interface MonitoringZone {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  people_count: number;
  created_at: string;
}

interface LeafletMapWithDrawProps {
  height?: string | number;
  zoom?: number;
  center?: [number, number];
  onMapReady?: (map: LeafletMapInstance) => void;
}

export const LeafletMapWithDraw = React.forwardRef<LeafletMapInstance, LeafletMapWithDrawProps>(
  (props, ref) => {
    const {
      height = '700px',
      zoom = 6,
      center = [13.08, 80.27],
      onMapReady,
    } = props;

    // Refs
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
    const drawnItemsRef = useRef<L.FeatureGroup>(L.featureGroup());
    const circlesRef = useRef<Map<string, LeafletCircle>>(new Map());
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Holding ref for the layer currently being created (waiting for name)
    const pendingLayerRef = useRef<L.Circle | null>(null);

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [existingZones, setExistingZones] = useState<MonitoringZone[]>([]);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // Dialog State
    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
    const [zoneName, setZoneName] = useState('');

    // Ref for offline mode
    const isOfflineModeRef = useRef(false);

    // Sync ref
    useEffect(() => {
      isOfflineModeRef.current = isOfflineMode;
    }, [isOfflineMode]);

    /**
     * Get zone color based on people count
     * 0: green, 20+: yellow, 30+: red, 50+: orange
     */
    const getZoneColor = (peopleCount: number): string => {
      if (peopleCount >= 50) return '#ff9800'; // orange
      if (peopleCount >= 30) return '#f44336'; // red
      if (peopleCount >= 20) return '#ffc107'; // yellow
      return '#4caf50'; // green (default)
    };

    /**
     * Fetch existing monitoring zones from Supabase
     */
    const fetchAndRenderZones = async (_map: LeafletMapInstance) => {
      try {
        const { data, error } = await supabase
          .from('monitoring_zones')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('⚠️ Could not fetch zones:', error.message);
          return;
        }

        if (data && data.length > 0) {
          setExistingZones(data);

          // Clear local layers
          circlesRef.current.forEach((circle) => circle.remove());
          circlesRef.current.clear();
          drawnItemsRef.current.clearLayers();

          // Render each zone as a circle on the map
          data.forEach((zone: MonitoringZone) => {
            try {
              // Ensure radius is a valid number
              const safeRadius = Number(zone.radius_meters);
              if (isNaN(safeRadius) || safeRadius <= 0) {
                console.warn('Invalid radius for zone:', zone);
                return;
              }

              const peopleCount = zone.people_count || 0;
              const zoneColor = getZoneColor(peopleCount);

              const circle = L.circle([zone.center_lat, zone.center_lng], {
                radius: safeRadius,
                color: zoneColor,
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.15,
                fillColor: zoneColor,
              })
                .bindPopup(
                  `<div style="font-size: 13px; font-family: Roboto, sans-serif;">
                    <div style="font-weight: 600; color: #1976d2; margin-bottom: 4px;">
                      ${zone.name || 'Unnamed Zone'}
                    </div>
                    <div style="margin: 8px 0;">
                      <strong>People Reported:</strong> <span style="color: ${zoneColor}; font-weight: bold;">${peopleCount}</span>
                    </div>
                    <strong>Radius:</strong> ${(zone.radius_meters / 1000).toFixed(2)} km<br/>
                    <div style="font-size: 11px; color: #666; margin-top: 4px;">
                      ${new Date(zone.created_at).toLocaleString()}
                    </div>
                  </div>`
                )
                .addTo(drawnItemsRef.current);

              // Store zone data on the circle for click handler
              (circle as any).zoneData = zone;

              circlesRef.current.set(zone.id, circle);
            } catch (err) {
              console.error('Error rendering zone:', zone, err);
            }
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    /**
     * Confirm Name and Save Zone
     */
    const handleNameSubmit = () => {
      if (pendingLayerRef.current) {
        const layer = pendingLayerRef.current;
        const c = layer.getLatLng();
        console.log('Naming zone:', zoneName, 'and saving...');

        // Add to map for visual feedback immediately
        drawnItemsRef.current.addLayer(layer);

        // Save to DB
        saveCircleToSupabase(c.lat, c.lng, layer.getRadius(), zoneName || 'Monitoring Zone');

        // Cleanup
        pendingLayerRef.current = null;
        setZoneName('');
        setIsNameDialogOpen(false);
      }
    };

    const handleNameCancel = () => {
      // If cancelled, do we discard the layer? 
      // Yes, usually cancelling creation means aborting.
      pendingLayerRef.current = null;
      setZoneName('');
      setIsNameDialogOpen(false);
    };

    /**
     * Save a newly drawn circle to Supabase
     */
    const saveCircleToSupabase = async (lat: number, lng: number, radius: number, name: string) => {
      try {
        setSaveSuccess(null);
        setMapError(null);

        const radiusMeters = Math.round(radius);
        const payload = {
          name: name,
          center_lat: lat,
          center_lng: lng,
          radius_meters: radiusMeters,
        };

        if (isOfflineModeRef.current) {
          console.warn('⚠️ Skipping save: Map is in OFFLINE MODE.');
          return;
        }

        console.log('📤 Inserting zone:', payload);
        const result = await safeInsert('monitoring_zones', payload);

        if (!result.success) {
          console.warn('⚠️ Zone save failed:', result.error);
          setMapError(`Save Failed: ${result.error}`);
          return;
        }

        console.log('✅ Zone saved:', result.data);
        setSaveSuccess(`✓ Saved "${name}"`);

        // Refresh zones
        if (mapInstanceRef.current) {
          setTimeout(() => fetchAndRenderZones(mapInstanceRef.current!), 500);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setMapError(`Error saving zone: ${errorMsg}`);
      }
    };

    /**
     * Map Initialization Effect
     */
    useEffect(() => {
      let isMounted = true;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: center as L.LatLngExpression,
        zoom: zoom,
        worldCopyJump: true,
        zoomControl: false,
      });

      mapInstanceRef.current = map;
      if (ref) {
        if (typeof ref === 'function') ref(map);
        else ref.current = map;
      }

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 2,
      }).addTo(map);

      // Zoom Control (Top Right)
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add Draw Control
      drawnItemsRef.current = L.featureGroup().addTo(map);

      const drawControl = new (L.Control as any).Draw({
        position: 'topright',
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true,
          // Keep the zone's existing color while editing (avoids defaulting to black).
          selectedPathOptions: {
            maintainColor: true,
            opacity: 0.85,
            fillOpacity: 0.18,
          },
        },
        draw: {
          marker: false,
          circlemarker: false, // CircleMarker is NOT resizable by distance
          polyline: false,
          polygon: false,
          rectangle: false,
          circle: {
            metric: true,
            feet: false,
            shapeOptions: {
              color: '#4caf50',
              weight: 2,
              opacity: 0.7,
              fillOpacity: 0.15,
              fillColor: '#4caf50',
            }
          }
        }
      });
      map.addControl(drawControl);

      const drawContainer = (drawControl as any).getContainer?.();
      if (drawContainer) {
        drawContainer.classList.add('leaflet-draw-center-right');
      }

      // --- EVENT LISTENERS ---

      // 1. Created -> Prompt Name
      const onDrawCreated = (e: any) => {
        const layer = e.layer;
        if (layer instanceof L.Circle) {
          if (isOfflineModeRef.current) {
            drawnItemsRef.current.addLayer(layer);
            return;
          }

          // Store layer temporarily and open dialog
          pendingLayerRef.current = layer;
          setIsNameDialogOpen(true);
        }
      };

      // 2. Deleted -> safeDelete
      const onDrawDeleted = async (e: any) => {
        const layers = e.layers;
        layers.eachLayer(async (layer: any) => {
          let deletedId: string | null = null;
          circlesRef.current.forEach((storedLayer, id) => {
            if (storedLayer === layer || (storedLayer as any)._leaflet_id === (layer as any)._leaflet_id) {
              deletedId = id;
            }
          });

          if (deletedId) {
            if (isOfflineModeRef.current) return;
            const result = await safeDelete('monitoring_zones', deletedId!);
            if (result.success) {
              circlesRef.current.delete(deletedId!);
              setExistingZones(prev => prev.filter(z => z.id !== deletedId));
            }
          }
        });
      };

      // 3. Edited -> safeUpdate (Fixes resizing/moving persistence)
      const onDrawEdited = async (e: any) => {
        const layers = e.layers;
        layers.eachLayer(async (layer: any) => {
          let editedId: string | null = null;
          // Find ID
          circlesRef.current.forEach((storedLayer, id) => {
            if (storedLayer === layer || (storedLayer as any)._leaflet_id === (layer as any)._leaflet_id) {
              editedId = id;
            }
          });

          if (editedId && layer instanceof L.Circle) {
            console.log('✏️ Editing zone:', editedId);

            if (isOfflineModeRef.current) {
              console.warn('Offline mode - edits local only');
              return;
            }

            const newCenter = layer.getLatLng();
            const newRadius = layer.getRadius();

            const payload = {
              center_lat: newCenter.lat,
              center_lng: newCenter.lng,
              radius_meters: Math.round(newRadius)
            };

            const result = await safeUpdate('monitoring_zones', editedId, payload);
            if (result.success) {
              console.log('✅ Zone updated:', result.data);
              setSaveSuccess('✓ Zone Updated');
            } else {
              console.error('❌ Update failed:', result.error);
              setMapError(`Update Failed: ${result.error}`);
            }
          }
        });
      };

      map.on('draw:created', onDrawCreated);
      map.on('draw:deleted', onDrawDeleted);
      map.on('draw:edited', onDrawEdited);

      // Async Init
      const initAsync = async () => {
        setIsLoading(true);
        const conn = await testSupabaseConnection();
        if (!isMounted) return;

        if (!conn.success) {
          // Supabase not configured (missing env vars) is not a network/connection issue.
          if (!conn.configured) {
            setMapError('Offline Mode: Supabase not configured (zones will not persist).');
            setIsOfflineMode(true);
            setIsLoading(false);
            return;
          }

          const isTableMissing = conn.message.includes('monitoring_zones" not found');
          if (isTableMissing) {
            setMapError('Database table missing. Offline Mode.');
            setIsOfflineMode(true);
            setIsLoading(false);
            return;
          }
          setMapError(`Connection issue: ${conn.message}. Offline Mode.`);
          setIsOfflineMode(true);
          setIsLoading(false);
          return;
        }

        await fetchAndRenderZones(map);
        if (isMounted) setIsLoading(false);
      };

      initAsync();

      resizeObserverRef.current = new ResizeObserver(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      });
      resizeObserverRef.current.observe(mapContainerRef.current!);

      if (onMapReady) onMapReady(map);

      return () => {
        isMounted = false;
        if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.off('draw:created', onDrawCreated);
          mapInstanceRef.current.off('draw:deleted', onDrawDeleted);
          mapInstanceRef.current.off('draw:edited', onDrawEdited);
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, []);

    const theme = useTheme();

    const clearAllZones = () => {
      drawnItemsRef.current.clearLayers();
      circlesRef.current.forEach(c => c.remove());
      circlesRef.current.clear();
      setExistingZones([]);
    };

    const refreshZones = () => {
      if (mapInstanceRef.current) {
        fetchAndRenderZones(mapInstanceRef.current);
      }
    };

    return (
      <Box sx={{ width: '100%', position: 'relative' }}>

        {/* Premium Header Toolbar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <LayersIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                Monitoring Zones
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Draw circles to create monitoring areas
              </Typography>
            </Box>

            {/* Connection Status */}
            <Chip
              icon={isOfflineMode ? <SignalWifiOffIcon /> : <SignalWifi4BarIcon />}
              label={isOfflineMode ? 'Offline' : 'Connected'}
              size="small"
              color={isOfflineMode ? 'error' : 'success'}
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: 11,
                '& .MuiChip-icon': { fontSize: 16 },
              }}
            />
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={`${existingZones.length} Active`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: 11,
              }}
            />
            <Tooltip title="Refresh zones from database">
              <span>
                <IconButton size="small" onClick={refreshZones} disabled={isOfflineMode}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Clear all local zones">
              <span>
                <IconButton
                  size="small"
                  onClick={clearAllZones}
                  disabled={existingZones.length === 0 && drawnItemsRef.current.getLayers().length === 0}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Paper>

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: height,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e0e0e0',
          }}
        >
          <Box
            ref={mapContainerRef}
            className="leaflet-monitoring-map"
            sx={{ width: '100%', height: '100%', zIndex: 1 }}
          />

          {isLoading && (
            <Box sx={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 1000,
              backdropFilter: 'blur(4px)'
            }}>
              <CircularProgress size={40} thickness={4} />
              <Typography variant="caption" sx={{ mt: 2, color: '#666' }}>
                Loading Map Data...
              </Typography>
            </Box>
          )}

          {mapError && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                zIndex: 999, width: '90%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden'
              }}
            >
              <Alert
                severity={mapError.startsWith('Offline Mode:') ? 'info' : 'warning'}
                onClose={() => setMapError(null)}
                sx={{ border: 'none' }}
              >
                <AlertTitle>{isOfflineMode ? 'Offline Mode' : 'System Alert'}</AlertTitle>
                {mapError}
              </Alert>
            </Paper>
          )}
        </Box>

        {/* Success Snackbar */}
        <Snackbar
          open={!!saveSuccess}
          autoHideDuration={4000}
          onClose={() => setSaveSuccess(null)}
          TransitionComponent={Fade}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSaveSuccess(null)}
            severity="success"
            variant="filled"
            sx={{ width: '100%', borderRadius: '8px', boxShadow: 3 }}
          >
            {saveSuccess}
          </Alert>
        </Snackbar>

        {/* Naming Dialog */}
        <Dialog open={isNameDialogOpen} onClose={handleNameCancel}>
          <DialogTitle>Name New Zone</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enter a name for this monitoring zone.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Zone Name"
              type="text"
              fullWidth
              variant="outlined"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleNameCancel} color="inherit">Cancel</Button>
            <Button onClick={handleNameSubmit} variant="contained" color="primary">Save Zone</Button>
          </DialogActions>
        </Dialog>

      </Box>
    );
  }
);

LeafletMapWithDraw.displayName = 'LeafletMapWithDraw';
export default LeafletMapWithDraw;
