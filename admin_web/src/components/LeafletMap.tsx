import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import L from 'leaflet';
import type { Map as LeafletMapInstance } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

import type { MonitoringZone } from '../types/monitoringZone';

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

  /**
   * When enabled, reduces marker visual effects (shadows/pulses)
   * to keep zone overlays readable during review.
   */
  zoneReviewMode?: boolean;

  /**
   * Show/hide monitoring zones (manual, drawable)
   */
  showMonitoringZones?: boolean;

  /**
   * Enable draw/edit tools for monitoring zones
   */
  monitoringEditEnabled?: boolean;

  onMonitoringZoneCreateRequested?: (params: {
    tempLayerId: number;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
  }) => void;

  onMonitoringZoneEdited?: (params: {
    zoneId: string;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
  }) => void;

  onMonitoringZoneDeleted?: (params: { zoneId: string }) => void;
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
  getMarkerCount: () => number;
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

  // Monitoring zones (manual)
  setMonitoringZones: (zones: MonitoringZone[]) => void;
  setMonitoringZonesVisible: (visible: boolean) => void;
  clearMonitoringZones: () => void;
  finalizeMonitoringZone: (tempLayerId: number, zone: MonitoringZone) => void;
  discardPendingMonitoringZone: (tempLayerId: number) => void;
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
      zoneReviewMode = false,
      showMonitoringZones = true,
      monitoringEditEnabled = false,
      onMonitoringZoneCreateRequested,
      onMonitoringZoneEdited,
      onMonitoringZoneDeleted,
    },
    ref
  ) => {
    // Refs for map instance and container
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const zonesRef = useRef<Map<string, L.Layer>>(new Map());

    // Monitoring zones live in a separate FeatureGroup so refreshing generated zones doesn't wipe them.
    const monitoringGroupRef = useRef<L.FeatureGroup>(L.featureGroup());
    const monitoringZonesRef = useRef<Map<string, L.Circle>>(new Map());
    const pendingMonitoringRef = useRef<Map<number, L.Circle>>(new Map());
    const drawControlRef = useRef<any | null>(null);

    const onMapReadyRef = useRef<LeafletMapProps['onMapReady']>(onMapReady);
    const initialCenterRef = useRef<[number, number]>(center);
    const initialZoomRef = useRef<number>(zoom);

    const showMonitoringZonesRef = useRef<boolean>(showMonitoringZones);
    const onMonitoringZoneCreateRequestedRef = useRef<LeafletMapProps['onMonitoringZoneCreateRequested']>(
      onMonitoringZoneCreateRequested
    );
    const onMonitoringZoneEditedRef = useRef<LeafletMapProps['onMonitoringZoneEdited']>(onMonitoringZoneEdited);
    const onMonitoringZoneDeletedRef = useRef<LeafletMapProps['onMonitoringZoneDeleted']>(onMonitoringZoneDeleted);

    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
      onMapReadyRef.current = onMapReady;
    }, [onMapReady]);

    useEffect(() => {
      showMonitoringZonesRef.current = showMonitoringZones;
    }, [showMonitoringZones]);

    useEffect(() => {
      onMonitoringZoneCreateRequestedRef.current = onMonitoringZoneCreateRequested;
    }, [onMonitoringZoneCreateRequested]);

    useEffect(() => {
      onMonitoringZoneEditedRef.current = onMonitoringZoneEdited;
    }, [onMonitoringZoneEdited]);

    useEffect(() => {
      onMonitoringZoneDeletedRef.current = onMonitoringZoneDeleted;
    }, [onMonitoringZoneDeleted]);

    const getMonitoringZoneColor = (peopleCount: number): string => {
      if (peopleCount >= 50) return '#ff9800';
      if (peopleCount >= 30) return '#f44336';
      if (peopleCount >= 20) return '#ffc107';
      return '#4caf50';
    };

    const ensureMonitoringGroupOnMap = (visible: boolean) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const group = monitoringGroupRef.current;
      const has = map.hasLayer(group);
      if (visible && !has) group.addTo(map);
      if (!visible && has) group.removeFrom(map);
    };

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

    const clearMonitoringZones = () => {
      monitoringZonesRef.current.forEach((circle) => circle.remove());
      monitoringZonesRef.current.clear();

      pendingMonitoringRef.current.forEach((circle) => circle.remove());
      pendingMonitoringRef.current.clear();

      monitoringGroupRef.current.clearLayers();
    };

    const setMonitoringZonesVisible = (visible: boolean) => {
      ensureMonitoringGroupOnMap(visible);
    };

    const setMonitoringZones = (zones: MonitoringZone[]) => {
      // Preserve any pending (unsaved) circle the admin is currently naming.
      monitoringZonesRef.current.forEach((circle) => circle.remove());
      monitoringZonesRef.current.clear();
      monitoringGroupRef.current.clearLayers();

      pendingMonitoringRef.current.forEach((circle) => {
        monitoringGroupRef.current.addLayer(circle);
      });

      zones.forEach((z) => {
        const zoneColor = getMonitoringZoneColor(Number(z.people_count ?? 0));
        const circle = L.circle([z.center_lat, z.center_lng], {
          radius: Number(z.radius_meters) || 0,
          color: zoneColor,
          weight: 3,
          opacity: 0.85,
          fillColor: zoneColor,
          fillOpacity: 0.18,
        });

        (circle as any)._monitoringZoneId = z.id;
        circle.bindPopup(
          `<div style="font-size: 12px; width: 240px; line-height: 1.4; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; padding-bottom:6px; border-bottom: 1px solid #e2e8f0;">
              <strong style="font-size: 13px; color: #0f172a;">Monitoring Zone</strong>
              <span style="padding: 2px 8px; border-radius: 999px; background: ${zoneColor}15; color: ${zoneColor}; font-weight: 700; font-size: 10px; letter-spacing: 0.4px;">MANUAL</span>
            </div>
            <div style="color:#334155; display:grid; gap:6px;">
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Name</span> <strong>${escapeHtml(z.name || 'Unnamed')}</strong></div>
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">People</span> <strong style="color:${zoneColor}">${Number(z.people_count ?? 0)}</strong></div>
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Radius</span> <strong>${Math.round(Number(z.radius_meters) || 0)} m</strong></div>
            </div>
          </div>`
        );

        monitoringGroupRef.current.addLayer(circle);
        monitoringZonesRef.current.set(z.id, circle);
      });

      ensureMonitoringGroupOnMap(showMonitoringZonesRef.current);
    };

    const finalizeMonitoringZone = (tempLayerId: number, zone: MonitoringZone) => {
      const circle = pendingMonitoringRef.current.get(tempLayerId);
      if (!circle) return;

      pendingMonitoringRef.current.delete(tempLayerId);
      (circle as any)._monitoringZoneId = zone.id;

      const zoneColor = getMonitoringZoneColor(Number(zone.people_count ?? 0));
      circle.setStyle({
        color: zoneColor,
        weight: 3,
        opacity: 0.85,
        fillColor: zoneColor,
        fillOpacity: 0.18,
      });

      circle.bindPopup(
        `<div style="font-size: 12px; width: 240px; line-height: 1.4; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; padding-bottom:6px; border-bottom: 1px solid #e2e8f0;">
            <strong style="font-size: 13px; color: #0f172a;">Monitoring Zone</strong>
            <span style="padding: 2px 8px; border-radius: 999px; background: ${zoneColor}15; color: ${zoneColor}; font-weight: 700; font-size: 10px; letter-spacing: 0.4px;">MANUAL</span>
          </div>
          <div style="color:#334155; display:grid; gap:6px;">
            <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Name</span> <strong>${escapeHtml(zone.name || 'Unnamed')}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">People</span> <strong style="color:${zoneColor}">${Number(zone.people_count ?? 0)}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Radius</span> <strong>${Math.round(Number(zone.radius_meters) || 0)} m</strong></div>
          </div>
        </div>`
      );

      monitoringZonesRef.current.set(zone.id, circle);
    };

    const discardPendingMonitoringZone = (tempLayerId: number) => {
      const circle = pendingMonitoringRef.current.get(tempLayerId);
      if (!circle) return;
      pendingMonitoringRef.current.delete(tempLayerId);
      circle.remove();
    };

    const getMarkerCount = () => markersRef.current.size;

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
      getMarkerCount,
      panToLocation,
      drawZone,
      getBounds,
      addZoneCircle,
      removeZone,
      clearAllZones,
      setMonitoringZones,
      setMonitoringZonesVisible,
      clearMonitoringZones,
      finalizeMonitoringZone,
      discardPendingMonitoringZone,
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
          zoomControl: false,
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

        // Monitoring zones group (manual circles)
        monitoringGroupRef.current.addTo(map);
        if (!showMonitoringZonesRef.current) {
          monitoringGroupRef.current.removeFrom(map);
        }

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

        // Zoom controls: keep them away from the floating layer panel (top-left)
        L.control.zoom({ position: 'topright' }).addTo(map);

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

          // Cleanup draw control + handlers
          map.off('draw:created');
          map.off('draw:edited');
          map.off('draw:deleted');
          if (drawControlRef.current) {
            try {
              map.removeControl(drawControlRef.current);
            } catch {
              // ignore
            }
            drawControlRef.current = null;
          }

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

    useEffect(() => {
      ensureMonitoringGroupOnMap(showMonitoringZones);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMonitoringZones]);

    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const removeDraw = () => {
        map.off('draw:created');
        map.off('draw:edited');
        map.off('draw:deleted');
        if (drawControlRef.current) {
          try {
            map.removeControl(drawControlRef.current);
          } catch {
            // ignore
          }
          drawControlRef.current = null;
        }
      };

      if (!monitoringEditEnabled) {
        removeDraw();
        return;
      }

      // Editing requires the group to be visible.
      ensureMonitoringGroupOnMap(true);
      removeDraw();

      const drawControl = new (L.Control as any).Draw({
        position: 'topright',
        edit: {
          featureGroup: monitoringGroupRef.current,
          remove: true,
          selectedPathOptions: {
            maintainColor: true,
            opacity: 0.9,
            fillOpacity: 0.2,
          },
        },
        draw: {
          marker: false,
          circlemarker: false,
          polyline: false,
          polygon: false,
          rectangle: false,
          circle: {
            metric: true,
            feet: false,
            shapeOptions: {
              color: '#4caf50',
              weight: 3,
              opacity: 0.85,
              fillOpacity: 0.18,
              fillColor: '#4caf50',
            },
          },
        },
      });

      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      const drawContainer = (drawControl as any).getContainer?.();
      if (drawContainer) {
        drawContainer.classList.add('leaflet-draw-monitoring-middle-right');
      }

      map.on('draw:created', (e: any) => {
        const layer = e.layer;
        if (!(layer instanceof L.Circle)) return;

        const tempLayerId = (layer as any)._leaflet_id as number;
        pendingMonitoringRef.current.set(tempLayerId, layer);
        monitoringGroupRef.current.addLayer(layer);

        const c = layer.getLatLng();
        layer.bindPopup(
          `<div style="font-size: 12px; font-family: system-ui, -apple-system, sans-serif;">
            <strong>New monitoring zone</strong><br/>
            <span style="color:#64748b">Enter a name to save</span>
          </div>`
        );

        onMonitoringZoneCreateRequestedRef.current?.({
          tempLayerId,
          center_lat: c.lat,
          center_lng: c.lng,
          radius_meters: layer.getRadius(),
        });
      });

      map.on('draw:edited', (e: any) => {
        e.layers.eachLayer((layer: any) => {
          if (!(layer instanceof L.Circle)) return;
          const zoneId = (layer as any)._monitoringZoneId as string | undefined;
          if (!zoneId) return;
          const c = layer.getLatLng();
          onMonitoringZoneEditedRef.current?.({
            zoneId,
            center_lat: c.lat,
            center_lng: c.lng,
            radius_meters: layer.getRadius(),
          });
        });
      });

      map.on('draw:deleted', (e: any) => {
        e.layers.eachLayer((layer: any) => {
          const zoneId = (layer as any)._monitoringZoneId as string | undefined;
          if (!zoneId) return;
          monitoringZonesRef.current.delete(zoneId);
          onMonitoringZoneDeletedRef.current?.({ zoneId });
        });
      });

      return () => {
        removeDraw();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monitoringEditEnabled]);

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
          className={[
            'leaflet-live-map',
            zoneReviewMode ? 'zone-review' : null,
          ]
            .filter(Boolean)
            .join(' ')}
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            '& .leaflet-container': {
              fontFamily: 'system-ui, -apple-system, sans-serif',
              zIndex: 1,
            },
            '& .leaflet-top .leaflet-control': {
              marginTop: 12,
            },
            '& .leaflet-right .leaflet-control': {
              marginRight: 12,
            },
            '& .leaflet-control': {
              backgroundColor: 'rgba(255,255,255,0.78)',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.12)',
              boxShadow: '0 10px 26px rgba(0,0,0,0.14)',
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
            },
            '& .leaflet-control-zoom': {
              borderRadius: '12px',
            },
            '& .leaflet-control-zoom a': {
              width: 38,
              height: 38,
              lineHeight: '38px',
              fontSize: 22,
              fontWeight: 800,
              color: 'rgba(15,23,42,0.82)',
              background: 'transparent',
              transition: 'background 120ms ease, color 120ms ease',
            },
            '& .leaflet-control-zoom a:hover': {
              background: 'rgba(2,6,23,0.06)',
              color: 'rgba(15,23,42,0.95)',
            },
            '& .leaflet-control-zoom a:focus': {
              outline: 'none',
            },
            '& .leaflet-control-zoom a:focus-visible': {
              outline: '2px solid rgba(59,130,246,0.65)',
              outlineOffset: -2,
            },
            '& .leaflet-control-zoom-in': {
              borderBottom: '1px solid rgba(2,6,23,0.10)',
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
