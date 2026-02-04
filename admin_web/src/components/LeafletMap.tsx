import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import L from 'leaflet';
import type { Map as LeafletMapInstance } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const computePinScale = (zoomLevel: number) => {
  // Scale gently with zoom so hitboxes stay reasonable.
  // Base: zoom 12 => 1.0; zoom +/-8 => x2 or x0.5
  const baseZoom = 12;
  const raw = Math.pow(2, (zoomLevel - baseZoom) / 8);
  return Math.max(0.7, Math.min(1.4, raw));
};

/**
 * LeafletMap Component
 *
 * Production-ready interactive map for admin dashboard using Leaflet.js and OpenStreetMap
 * Features:
 * - Real-time map rendering with proper initialization
 * - Interactive zoom, pan, and mobile support
 * - Handles tab layout visibility issues
 * - Extensible for future zone drawing and marker placement
 * - WebSocket-ready for real-time updates
 */

interface LeafletMapProps {
  /**
   * Optional height of the map container (default: 600px)
   * Suitable for dashboard tab layouts
   */
  height?: string | number;

  /**
   * Callback fired when map is fully loaded
   * Useful for adding markers, zones, or event listeners after initialization
   */
  onMapReady?: (map: LeafletMapInstance) => void;

  /**
   * Optional initial zoom level (default: 6)
   * Lower = more zoomed out, higher = more zoomed in
   */
  zoom?: number;

  /**
   * Optional initial center coordinates
   * Default: India's coastline (13.08, 80.27) - suitable for coastal disaster monitoring
   */
  center?: [number, number];
}

interface ReportMarker {
  id: string;
  lat: number;
  lng: number;
  kind?: 'hazard' | 'advisory';
  // Hazard markers
  hazardType?: string;
  urgency?: string;
  // Advisory markers
  category?: string;
  severity?: string;
  region?: string | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  contact?: string | null;
  title: string;
  timestamp: string;
}

/**
 * Leaflet marker icon configurations
 * Match with hazard urgency levels
 */
const normalizeUrgency = (urgency: string) => urgency.trim().toLowerCase();

const getUrgencyVariant = (urgency: string): 'critical' | 'high' | 'medium' | 'low' => {
  const normalized = normalizeUrgency(urgency);
  if (normalized === 'critical') return 'critical';
  if (normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  if (normalized === 'low') return 'low';
  return 'medium';
};

const getHazardAbbrev = (hazardType: string) => {
  const t = hazardType.trim().toLowerCase();
  if (t === 'high waves') return 'HW';
  if (t === 'tsunami') return 'TS';
  if (t === 'storm') return 'ST';
  if (t === 'flood') return 'FL';
  if (t === 'other') return 'OT';
  const parts = hazardType
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean).slice(0, 2);
  return (letters.join('') || 'HZ').slice(0, 2);
};

const getAdvisoryAbbrev = (category: string) => {
  const t = category.trim().toLowerCase();
  if (t === 'food') return 'FD';
  if (t === 'shelter') return 'SH';
  if (t === 'medical') return 'MD';
  if (t === 'rescue') return 'RS';
  if (t === 'roadblock') return 'RB';
  if (t === 'warning') return 'WR';
  if (t === 'evacuation') return 'EV';
  const parts = category
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean).slice(0, 2);
  return (letters.join('') || 'UP').slice(0, 2);
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getMarkerIcon = (marker: ReportMarker) => {
  const kind = marker.kind ?? 'hazard';

  if (kind === 'advisory') {
    const category = marker.category ?? 'warning';
    const label = getAdvisoryAbbrev(category);
    return L.divIcon({
      html: `
        <div class="hazard-pin hazard-pin--advisory hazard-pin--cat-${escapeHtml(category.toLowerCase())}" aria-label="${escapeHtml(category)}">
          <div class="hazard-pin__pulse"></div>
          <div class="hazard-pin__body">
            <div class="hazard-pin__label">${escapeHtml(label)}</div>
          </div>
        </div>
      `,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -36],
      className: 'hazard-marker',
    });
  }

  const urgency = marker.urgency ?? 'medium';
  const hazardType = marker.hazardType ?? 'Hazard';
  const variant = getUrgencyVariant(urgency);
  const label = getHazardAbbrev(hazardType);

  return L.divIcon({
    html: `
      <div class="hazard-pin hazard-pin--${variant}" aria-label="${escapeHtml(hazardType)}">
        <div class="hazard-pin__pulse"></div>
        <div class="hazard-pin__body">
          <div class="hazard-pin__label">${escapeHtml(label)}</div>
        </div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -36],
    className: 'hazard-marker',
  });
};

export interface MapMethods {
  handleTabVisible: () => void;
  addMarker: (report: ReportMarker) => void;
  removeMarker: (reportId: string) => void;
  clearAllMarkers: () => void;
  panToLocation: (lat: number, lng: number, zoomLevel?: number) => void;
  drawZone: (coordinates: Array<[number, number]>, name: string, color?: string) => L.Polygon | undefined;

  // Zone overlays (generated zones / circles)
  getBounds: () => { minLat: number; maxLat: number; minLon: number; maxLon: number } | null;
  addZoneCircle: (params: {
    id: string;
    lat: number;
    lng: number;
    radiusMeters: number;
    color: string;
    fillColor?: string;
    fillOpacity?: number;
    weight?: number;
    dashArray?: string;
    popupHtml?: string;
  }) => void;
  removeZone: (id: string) => void;
  clearAllZones: () => void;
}

/**
 * Main Leaflet Map Component
 * Initializes and manages the interactive map for hazard monitoring
 */
export const LeafletMap = React.forwardRef<MapMethods, LeafletMapProps>(
  (
    {
      height = '600px',
      onMapReady,
      zoom = 6,
      center = [13.08, 80.27], // India's coastline (default)
    },
    ref
  ) => {
    // Refs for map instance and container
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const zonesRef = useRef<Map<string, L.Layer>>(new Map());
    const onMapReadyRef = useRef<LeafletMapProps['onMapReady']>(onMapReady);
    const initialCenterRef = useRef<[number, number]>(center);
    const initialZoomRef = useRef<number>(zoom);

    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
      onMapReadyRef.current = onMapReady;
    }, [onMapReady]);

    /**
     * Force map resize when tab becomes visible
     * Useful for dashboard tab layouts
     */
    const handleTabVisible = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 300);
      }
    };

    /**
     * Add a hazard report marker to the map
     */
    const addMarker = (report: ReportMarker) => {
      if (!mapInstanceRef.current) return;

      const kind = report.kind ?? 'hazard';

      if (kind === 'advisory') {
        const category = report.category ?? 'warning';
        const severity = (report.severity ?? 'info').toUpperCase();
        const sevColor =
          severity === 'WARNING'
            ? '#ef4444'
            : severity === 'WATCH'
              ? '#f59e0b'
              : '#0ea5e9';

        const validity =
          report.startsAt || report.expiresAt
            ? `${report.startsAt ? escapeHtml(new Date(report.startsAt).toLocaleString()) : '—'} → ${report.expiresAt ? escapeHtml(new Date(report.expiresAt).toLocaleString()) : '—'}`
            : null;

        const marker = L.marker([report.lat, report.lng], {
          icon: getMarkerIcon(report),
          title: report.title,
        })
          .bindPopup(`
            <div style="font-size: 12px; width: 240px; line-height: 1.35; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
                <strong style="font-size: 13px;">${escapeHtml(report.title)}</strong>
                <span style="
                  padding: 2px 8px;
                  border-radius: 999px;
                  border: 1px solid rgba(0,0,0,0.08);
                  background: rgba(255,255,255,0.85);
                  color: ${sevColor};
                  font-weight: 800;
                  font-size: 11px;
                ">${escapeHtml(severity)}</span>
              </div>
              <div style="color: #475569;">
                <div><span style="color:#64748b">Category:</span> ${escapeHtml(category)}</div>
                ${report.region ? `<div><span style="color:#64748b">Region:</span> ${escapeHtml(report.region)}</div>` : ''}
                ${validity ? `<div><span style="color:#64748b">Validity:</span> ${validity}</div>` : ''}
                ${report.contact ? `<div><span style="color:#64748b">Contact:</span> ${escapeHtml(report.contact)}</div>` : ''}
                <div><span style="color:#64748b">Location:</span> ${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}</div>
                <div style="margin-top:6px; color:#64748b; font-size:11px;">${escapeHtml(new Date(report.timestamp).toLocaleString())}</div>
              </div>
            </div>
          `)
          .addTo(mapInstanceRef.current);

        markersRef.current.set(report.id, marker);
        return;
      }

      const variant = getUrgencyVariant(report.urgency ?? 'medium');
      const urgencyLabel = variant.toUpperCase();
      const urgencyColor =
        variant === 'critical'
          ? '#ef4444'
          : variant === 'high'
            ? '#f97316'
            : variant === 'medium'
              ? '#f59e0b'
              : '#eab308';

      const marker = L.marker([report.lat, report.lng], {
        icon: getMarkerIcon(report),
        title: report.title,
      })
        .bindPopup(`
          <div style="font-size: 12px; width: 220px; line-height: 1.35; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
              <strong style="font-size: 13px;">${escapeHtml(report.title)}</strong>
              <span style="
                padding: 2px 8px;
                border-radius: 999px;
                border: 1px solid rgba(0,0,0,0.08);
                background: rgba(255,255,255,0.85);
                color: ${urgencyColor};
                font-weight: 700;
                font-size: 11px;
              ">${urgencyLabel}</span>
            </div>
            <div style="color: #475569;">
              <div><span style="color:#64748b">Type:</span> ${escapeHtml(report.hazardType ?? 'Hazard')}</div>
              <div><span style="color:#64748b">Location:</span> ${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}</div>
              <div style="margin-top:6px; color:#64748b; font-size:11px;">${escapeHtml(new Date(report.timestamp).toLocaleString())}</div>
            </div>
          </div>
        `)
        .addTo(mapInstanceRef.current);

      markersRef.current.set(report.id, marker);
    };

    /**
     * Remove a marker from the map
     */
    const removeMarker = (reportId: string) => {
      const marker = markersRef.current.get(reportId);
      if (marker && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
        markersRef.current.delete(reportId);
      }
    };

    /**
     * Clear all markers from the map
     */
    const clearAllMarkers = () => {
      markersRef.current.forEach((marker) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current.clear();
    };

    const getBounds = () => {
      const map = mapInstanceRef.current;
      if (!map) return null;
      const b = map.getBounds();
      return {
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLon: b.getWest(),
        maxLon: b.getEast(),
      };
    };

    const removeZone = (id: string) => {
      const layer = zonesRef.current.get(id);
      if (layer && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(layer);
      }
      zonesRef.current.delete(id);
    };

    const clearAllZones = () => {
      zonesRef.current.forEach((layer) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
      zonesRef.current.clear();
    };

    const addZoneCircle = (params: {
      id: string;
      lat: number;
      lng: number;
      radiusMeters: number;
      color: string;
      fillColor?: string;
      fillOpacity?: number;
      weight?: number;
      dashArray?: string;
      popupHtml?: string;
    }) => {
      if (!mapInstanceRef.current) return;

      // Replace existing layer for this id.
      removeZone(params.id);

      const circle = L.circle([params.lat, params.lng], {
        radius: params.radiusMeters,
        color: params.color,
        weight: params.weight ?? 2,
        opacity: 0.9,
        fillColor: params.fillColor ?? params.color,
        fillOpacity: params.fillOpacity ?? 0.12,
        dashArray: params.dashArray,
      });

      if (params.popupHtml) {
        circle.bindPopup(params.popupHtml);
      }

      circle.addTo(mapInstanceRef.current);
      zonesRef.current.set(params.id, circle);
    };

    /**
     * Pan map to a specific location
     */
    const panToLocation = (lat: number, lng: number, zoomLevel?: number) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], zoomLevel);
      }
    };

    /**
     * Draw a zone boundary (polygon or rectangle)
     */
    const drawZone = (
      coordinates: Array<[number, number]>,
      name: string,
      color = '#2563eb'
    ) => {
      if (!mapInstanceRef.current || coordinates.length < 3) return;

      const polygon = L.polygon(coordinates, {
        color: color,
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.2,
        fillColor: color,
      })
        .bindPopup(name)
        .addTo(mapInstanceRef.current);

      return polygon;
    };

    // Expose map methods via ref
    React.useImperativeHandle(ref, () => ({
      handleTabVisible,
      addMarker,
      removeMarker,
      clearAllMarkers,
      panToLocation,
      drawZone,
      getBounds,
      addZoneCircle,
      removeZone,
      clearAllZones,
    }));

    /**
     * Initialize Leaflet map on component mount
     */
    useEffect(() => {
      if (!mapContainerRef.current) {
        setMapError('Map container not found');
        return;
      }

      try {
        // Create Leaflet map instance
        const map = L.map(mapContainerRef.current, {
          center: initialCenterRef.current as L.LatLngExpression,
          zoom: initialZoomRef.current,
          worldCopyJump: true,
          maxBounds: [
            [-90, -180],
            [90, 180],
          ],
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 2,
          updateWhenIdle: true,
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsLoading(false);

        // Zoom-aware marker scaling (CSS variable consumed by .hazard-pin)
        const container = map.getContainer();
        let rafId: number | null = null;

        const updatePinScale = () => {
          const scale = computePinScale(map.getZoom());
          container.style.setProperty('--hazard-pin-scale', String(scale));
        };

        const scheduleUpdate = () => {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }
          rafId = requestAnimationFrame(() => {
            rafId = null;
            updatePinScale();
          });
        };

        updatePinScale();
        map.on('zoom', scheduleUpdate);

        // Add scale control
        L.control.scale({ imperial: false, metric: true }).addTo(map);

        // Handle resize
        const handleMapResize = () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        };

        window.addEventListener('resize', handleMapResize);

        onMapReadyRef.current?.(map);

        return () => {
          window.removeEventListener('resize', handleMapResize);
          map.off('zoom', scheduleUpdate);
          if (rafId !== null) cancelAnimationFrame(rafId);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
          }
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
        setMapError(errorMessage);
        setIsLoading(false);
      }
    }, []);

    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: height,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
        }}
      >
        <Box
          ref={mapContainerRef}
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            '& .leaflet-container': {
              fontFamily: 'system-ui, -apple-system, sans-serif',
              zIndex: 1,
            },
            '& .leaflet-control': {
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            },
            '& .leaflet-control-zoom-in, & .leaflet-control-zoom-out': {
              backgroundColor: 'white',
              color: '#333',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            },
          }}
        />

        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 10,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {mapError && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffebee',
              zIndex: 10,
            }}
          >
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <strong style={{ color: '#c62828' }}>Map Error</strong>
              <p style={{ color: '#666', marginTop: '8px' }}>{mapError}</p>
            </Box>
          </Box>
        )}
      </Box>
    );
  }
);

LeafletMap.displayName = 'LeafletMap';

export default LeafletMap;
