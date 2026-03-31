import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import L from 'leaflet';
import type { Map as LeafletMapInstance } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

import type {
  LiveExactPin,
  LivePresenceCell,
  MonitoringZone,
  MonitoringZoneCoordinate,
  MonitoringZoneShape,
} from '../types/monitoringZone';

const patchLeafletDrawReadableAreaBug = () => {
  const geometryUtil = (L as typeof L & {
    GeometryUtil?: {
      formattedNumber?: (value: number, precision?: number) => string;
      readableArea?: (
        area: number,
        isMetric?: boolean | string | string[],
        precision?: L.PrecisionOptions | Record<string, number>,
      ) => string;
    };
    Util: typeof L.Util;
  }).GeometryUtil;

  if (!geometryUtil?.formattedNumber) return;

  geometryUtil.readableArea = (
    area: number,
    isMetric: boolean | string | string[] = true,
    precision?: L.PrecisionOptions | Record<string, number>
  ) => {
    const defaultPrecision = {
      km: 2,
      ha: 2,
      m: 0,
      mi: 2,
      ac: 2,
      yd: 0,
      ft: 0,
      nm: 2,
    };
    const resolvedPrecision = L.Util.extend({}, defaultPrecision, precision ?? {});

    if (isMetric) {
      let units: string[] = ['ha', 'm'];
      if (typeof isMetric === 'string') {
        units = [isMetric];
      } else if (Array.isArray(isMetric)) {
        units = isMetric;
      }

      if (area >= 1000000 && units.includes('km')) {
        return `${geometryUtil.formattedNumber!(area * 0.000001, resolvedPrecision.km)} km²`;
      }
      if (area >= 10000 && units.includes('ha')) {
        return `${geometryUtil.formattedNumber!(area * 0.0001, resolvedPrecision.ha)} ha`;
      }
      return `${geometryUtil.formattedNumber!(area, resolvedPrecision.m)} m²`;
    }

    const squareYards = area / 0.836127;
    if (squareYards >= 3097600) {
      return `${geometryUtil.formattedNumber!(squareYards / 3097600, resolvedPrecision.mi)} mi²`;
    }
    if (squareYards >= 4840) {
      return `${geometryUtil.formattedNumber!(squareYards / 4840, resolvedPrecision.ac)} acres`;
    }
    return `${geometryUtil.formattedNumber!(squareYards, resolvedPrecision.yd)} yd²`;
  };
};

patchLeafletDrawReadableAreaBug();

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
    shape: MonitoringZoneShape;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
    polygon_points?: MonitoringZoneCoordinate[] | null;
  }) => void;

  onMonitoringZoneEdited?: (params: {
    zoneId: string;
    shape: MonitoringZoneShape;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
    polygon_points?: MonitoringZoneCoordinate[] | null;
  }) => void;

  onMonitoringZoneDeleted?: (params: { zoneId: string }) => void;
  onMonitoringZoneSelected?: (zone: MonitoringZone | null) => void;
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

const getHazardTypeClass = (hazardType: string) => {
  const t = hazardType.trim().toLowerCase();
  if (t === 'tsunami') return 'tsunami';
  if (t === 'storm') return 'storm';
  if (t === 'high waves') return 'highwaves';
  if (t === 'flood') return 'flood';
  return 'other';
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
  const typeClass = getHazardTypeClass(hazardType);
  const label = getHazardAbbrev(hazardType);

  return L.divIcon({
    html: `
      <div class="hazard-pin hazard-pin--${typeClass} hazard-pin--urgency-${variant}" aria-label="${escapeHtml(hazardType)}">
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

const formatTimestampLabel = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
};

const maskIdentifier = (value: string) => {
  if (!value) return 'Unknown';
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const getPresenceCellIcon = (peopleCount: number) =>
  L.divIcon({
    html: `
      <div style="
        width:${Math.min(44, Math.max(24, 18 + peopleCount * 3))}px;
        height:${Math.min(44, Math.max(24, 18 + peopleCount * 3))}px;
        border-radius:999px;
        background:rgba(8,145,178,0.86);
        border:2px solid rgba(255,255,255,0.92);
        box-shadow:0 10px 24px rgba(8,145,178,0.35);
        display:flex;
        align-items:center;
        justify-content:center;
        color:#ffffff;
        font-weight:800;
        font-size:12px;
      ">${peopleCount}</div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    className: 'live-presence-cell-marker',
  });

export interface MapMethods {
  handleTabVisible: () => void;
  addMarker: (report: ReportMarker) => void;
  removeMarker: (reportId: string) => void;
  clearAllMarkers: () => void;
  getMarkerCount: () => number;
  panToLocation: (lat: number, lng: number, zoomLevel?: number) => void;
  getZoomLevel: () => number | null;
  fitToDataBounds: (params: {
    points?: Array<[number, number]>;
    circles?: Array<{ lat: number; lng: number; radiusMeters: number }>;
    polygons?: MonitoringZoneCoordinate[][];
    maxZoom?: number;
  }) => boolean;
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
  setLivePresenceCells: (cells: LivePresenceCell[]) => void;
  clearLivePresenceCells: () => void;
  setLiveExactPins: (pins: LiveExactPin[]) => void;
  clearLiveExactPins: () => void;
  /** Returns the raw map container DOM element for image capture */
  getMapContainer: () => HTMLElement | null;
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
      onMonitoringZoneSelected,
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
    const livePresenceGroupRef = useRef<L.FeatureGroup>(L.featureGroup());
    const liveExactPinsGroupRef = useRef<L.FeatureGroup>(L.featureGroup());
    const monitoringZonesRef = useRef<Map<string, L.Circle | L.Polygon>>(new Map());
    const pendingMonitoringRef = useRef<Map<number, L.Circle | L.Polygon>>(new Map());
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
    const onMonitoringZoneSelectedRef = useRef<LeafletMapProps['onMonitoringZoneSelected']>(onMonitoringZoneSelected);

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

    useEffect(() => {
      onMonitoringZoneSelectedRef.current = onMonitoringZoneSelected;
    }, [onMonitoringZoneSelected]);

    const getMonitoringZoneColor = (peopleCount: number): string => {
      if (peopleCount >= 50) return '#ff9800';
      if (peopleCount >= 30) return '#f44336';
      if (peopleCount >= 20) return '#ffc107';
      return '#4caf50';
    };

    const normalizePolygonLatLngs = (latLngs: L.LatLng[] | L.LatLng[][] | L.LatLng[][][]): L.LatLng[] => {
      if (!Array.isArray(latLngs) || latLngs.length === 0) return [];
      if (latLngs[0] instanceof L.LatLng) {
        return latLngs as L.LatLng[];
      }
      return normalizePolygonLatLngs(latLngs[0] as L.LatLng[] | L.LatLng[][]);
    };

    const toPolygonPoints = (latLngs: L.LatLng[]): MonitoringZoneCoordinate[] =>
      latLngs.map((point) => ({ lat: point.lat, lng: point.lng }));

    const summarizePolygon = (points: MonitoringZoneCoordinate[]) => {
      if (points.length < 3) {
        return {
          center_lat: 0,
          center_lng: 0,
          radius_meters: 0,
        };
      }

      const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number]));
      const center = bounds.getCenter();
      let radiusMeters = 0;

      points.forEach((point) => {
        const distance = center.distanceTo(L.latLng(point.lat, point.lng));
        if (distance > radiusMeters) radiusMeters = distance;
      });

      return {
        center_lat: center.lat,
        center_lng: center.lng,
        radius_meters: Math.ceil(radiusMeters),
      };
    };

    const getLayerPolygonPoints = (layer: L.Circle | L.Polygon): MonitoringZoneCoordinate[] | null => {
      if (!(layer instanceof L.Polygon) || layer instanceof L.Circle) return null;
      const points = toPolygonPoints(normalizePolygonLatLngs(layer.getLatLngs() as L.LatLng[] | L.LatLng[][] | L.LatLng[][][]));
      return points.length >= 3 ? points : null;
    };

    const getMonitoringLayerPayload = (layer: L.Circle | L.Polygon) => {
      if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        return {
          shape: 'circle' as const,
          center_lat: center.lat,
          center_lng: center.lng,
          radius_meters: layer.getRadius(),
          polygon_points: null,
        };
      }

      const polygonPoints = getLayerPolygonPoints(layer) ?? [];
      const summary = summarizePolygon(polygonPoints);

      return {
        shape: 'polygon' as const,
        center_lat: summary.center_lat,
        center_lng: summary.center_lng,
        radius_meters: summary.radius_meters,
        polygon_points: polygonPoints,
      };
    };

    const buildMonitoringZonePopup = (zone: MonitoringZone, zoneColor: string) => {
      const shapeLabel = zone.shape === 'polygon' ? 'POLYGON' : 'CIRCLE';
      const coverageLabel = zone.shape === 'polygon'
        ? `<div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Vertices</span> <strong>${zone.polygon_points?.length ?? 0}</strong></div>`
        : `<div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Radius</span> <strong>${Math.round(Number(zone.radius_meters) || 0)} m</strong></div>`;
      const descriptionHtml = zone.description.trim().length > 0
        ? `<div style="margin-top:10px; padding-top:8px; border-top: 1px solid #e2e8f0;">
             <div style="color:#94a3b8; margin-bottom:4px;">Description</div>
             <div style="color:#334155; white-space:pre-wrap;">${escapeHtml(zone.description)}</div>
           </div>`
        : '';

      return `
        <div style="font-size: 12px; width: 240px; line-height: 1.4; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; padding-bottom:6px; border-bottom: 1px solid #e2e8f0;">
            <strong style="font-size: 13px; color: #0f172a;">Monitoring Zone</strong>
            <span style="padding: 2px 8px; border-radius: 999px; background: ${zoneColor}15; color: ${zoneColor}; font-weight: 700; font-size: 10px; letter-spacing: 0.4px;">${shapeLabel}</span>
          </div>
          <div style="color:#334155; display:grid; gap:6px;">
            <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">Name</span> <strong>${escapeHtml(zone.name || 'Unnamed')}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8">People</span> <strong style="color:${zoneColor}">${Number(zone.people_count ?? 0)}</strong></div>
            ${coverageLabel}
          </div>
          ${descriptionHtml}
        </div>`;
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
      onMonitoringZoneSelectedRef.current?.(null);
    };

    const clearLivePresenceCells = () => {
      livePresenceGroupRef.current.clearLayers();
    };

    const clearLiveExactPins = () => {
      liveExactPinsGroupRef.current.clearLayers();
    };

    const setLivePresenceCells = (cells: LivePresenceCell[]) => {
      clearLivePresenceCells();

      cells.forEach((cell) => {
        const marker = L.marker([cell.center_lat, cell.center_lng], {
          icon: getPresenceCellIcon(cell.people_count),
          title: `${cell.people_count} live device${cell.people_count === 1 ? '' : 's'}`,
        });

        marker.bindPopup(`
          <div style="font-size: 12px; width: 220px; line-height: 1.4; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #e2e8f0;">
              <strong style="font-size:13px; color:#0f172a;">Live Presence Cell</strong>
              <span style="padding:2px 8px; border-radius:999px; background:rgba(8,145,178,0.12); color:#0f766e; font-weight:700; font-size:10px;">ANONYMIZED</span>
            </div>
            <div style="display:grid; gap:6px; color:#334155;">
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">People</span><strong>${cell.people_count}</strong></div>
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Last Seen</span><strong>${escapeHtml(formatTimestampLabel(cell.latest_observed_at))}</strong></div>
            </div>
          </div>
        `);

        livePresenceGroupRef.current.addLayer(marker);
      });
    };

    const setLiveExactPins = (pins: LiveExactPin[]) => {
      clearLiveExactPins();

      pins.forEach((pin) => {
        const marker = L.circleMarker([pin.latitude, pin.longitude], {
          radius: 8,
          color: '#0f172a',
          weight: 2,
          fillColor: '#f97316',
          fillOpacity: 0.92,
        });

        marker.bindPopup(`
          <div style="font-size: 12px; width: 250px; line-height: 1.4; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #e2e8f0;">
              <strong style="font-size:13px; color:#0f172a;">Emergency Live Pin</strong>
              <span style="padding:2px 8px; border-radius:999px; background:rgba(249,115,22,0.12); color:#c2410c; font-weight:700; font-size:10px;">EXACT</span>
            </div>
            <div style="display:grid; gap:6px; color:#334155;">
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Device</span><strong>${escapeHtml(maskIdentifier(pin.device_id))}</strong></div>
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">User</span><strong>${escapeHtml(maskIdentifier(pin.user_id))}</strong></div>
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Source</span><strong>${escapeHtml(pin.source)}</strong></div>
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Accuracy</span><strong>${pin.accuracy_meters == null ? 'Unknown' : `${Math.round(pin.accuracy_meters)} m`}</strong></div>
              <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Last Seen</span><strong>${escapeHtml(formatTimestampLabel(pin.observed_at))}</strong></div>
            </div>
          </div>
        `);

        liveExactPinsGroupRef.current.addLayer(marker);
      });
    };

    const setMonitoringZonesVisible = (visible: boolean) => {
      ensureMonitoringGroupOnMap(visible);
    };

    const setMonitoringZones = (zones: MonitoringZone[]) => {
      // Preserve any pending (unsaved) circle the admin is currently naming.
      monitoringZonesRef.current.forEach((layer) => layer.remove());
      monitoringZonesRef.current.clear();
      monitoringGroupRef.current.clearLayers();

      pendingMonitoringRef.current.forEach((layer) => {
        monitoringGroupRef.current.addLayer(layer);
      });

      zones.forEach((z) => {
        const zoneColor = getMonitoringZoneColor(Number(z.people_count ?? 0));
        const layer =
          z.shape === 'polygon' && (z.polygon_points?.length ?? 0) >= 3
            ? L.polygon(
                (z.polygon_points ?? []).map((point) => [point.lat, point.lng] as [number, number]),
                {
                  color: zoneColor,
                  weight: 3,
                  opacity: 0.85,
                  fillColor: zoneColor,
                  fillOpacity: 0.18,
                }
              )
            : L.circle([z.center_lat, z.center_lng], {
                radius: Number(z.radius_meters) || 0,
                color: zoneColor,
                weight: 3,
                opacity: 0.85,
                fillColor: zoneColor,
                fillOpacity: 0.18,
              });

        (layer as any)._monitoringZoneId = z.id;
        layer.on('click', () => {
          onMonitoringZoneSelectedRef.current?.(z);
        });
        layer.bindPopup(buildMonitoringZonePopup(z, zoneColor));

        monitoringGroupRef.current.addLayer(layer);
        monitoringZonesRef.current.set(z.id, layer);
      });

      ensureMonitoringGroupOnMap(showMonitoringZonesRef.current);
    };

    const finalizeMonitoringZone = (tempLayerId: number, zone: MonitoringZone) => {
      const layer = pendingMonitoringRef.current.get(tempLayerId);
      if (!layer) return;

      pendingMonitoringRef.current.delete(tempLayerId);
      (layer as any)._monitoringZoneId = zone.id;
      layer.on('click', () => {
        onMonitoringZoneSelectedRef.current?.(zone);
      });

      const zoneColor = getMonitoringZoneColor(Number(zone.people_count ?? 0));
      layer.setStyle({
        color: zoneColor,
        weight: 3,
        opacity: 0.85,
        fillColor: zoneColor,
        fillOpacity: 0.18,
      });

      layer.bindPopup(buildMonitoringZonePopup(zone, zoneColor));

      monitoringZonesRef.current.set(zone.id, layer);
    };

    const discardPendingMonitoringZone = (tempLayerId: number) => {
      const layer = pendingMonitoringRef.current.get(tempLayerId);
      if (!layer) return;
      pendingMonitoringRef.current.delete(tempLayerId);
      layer.remove();
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

    const getZoomLevel = () => {
      if (!mapInstanceRef.current) return null;
      return mapInstanceRef.current.getZoom();
    };

    const fitToDataBounds = (params: {
      points?: Array<[number, number]>;
      circles?: Array<{ lat: number; lng: number; radiusMeters: number }>;
      polygons?: MonitoringZoneCoordinate[][];
      maxZoom?: number;
    }) => {
      const map = mapInstanceRef.current;
      if (!map) return false;

      const bounds = L.latLngBounds([]);

      (params.points ?? []).forEach(([lat, lng]) => {
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          bounds.extend([lat, lng]);
        }
      });

      (params.circles ?? []).forEach((circle) => {
        if (
          Number.isFinite(circle.lat)
          && Number.isFinite(circle.lng)
          && Number.isFinite(circle.radiusMeters)
          && circle.radiusMeters > 0
        ) {
          const circleBounds = L.circle([circle.lat, circle.lng], { radius: circle.radiusMeters }).getBounds();
          bounds.extend(circleBounds);
        }
      });

      (params.polygons ?? []).forEach((polygon) => {
        polygon.forEach((point) => {
          if (Number.isFinite(point.lat) && Number.isFinite(point.lng)) {
            bounds.extend([point.lat, point.lng]);
          }
        });
      });

      if (!bounds.isValid()) return false;

      map.fitBounds(bounds, {
        padding: [48, 48],
        maxZoom: params.maxZoom ?? 12,
      });

      return true;
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
      getZoomLevel,
      fitToDataBounds,
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
      setLivePresenceCells,
      clearLivePresenceCells,
      setLiveExactPins,
      clearLiveExactPins,
      getMapContainer: () => mapContainerRef.current,
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
        livePresenceGroupRef.current.addTo(map);
        liveExactPinsGroupRef.current.addTo(map);
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
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: '#2563eb',
              weight: 3,
              opacity: 0.85,
              fillOpacity: 0.16,
              fillColor: '#2563eb',
            },
          },
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
        const isCircle = layer instanceof L.Circle;
        const isPolygon = layer instanceof L.Polygon && !(layer instanceof L.Circle);
        if (!isCircle && !isPolygon) return;

        const monitoringLayer = layer as L.Circle | L.Polygon;
        const tempLayerId = (monitoringLayer as any)._leaflet_id as number;
        pendingMonitoringRef.current.set(tempLayerId, monitoringLayer);
        monitoringGroupRef.current.addLayer(layer);

        const payload = getMonitoringLayerPayload(monitoringLayer);
        const draftLabel = payload.shape === 'polygon' ? 'New polygon zone' : 'New monitoring zone';

        monitoringLayer.bindPopup(
          `<div style="font-size: 12px; font-family: system-ui, -apple-system, sans-serif;">
            <strong>${draftLabel}</strong><br/>
            <span style="color:#64748b">Enter a name to save</span>
          </div>`
        );

        onMonitoringZoneCreateRequestedRef.current?.({
          tempLayerId,
          ...payload,
        });
      });

      map.on('draw:edited', (e: any) => {
        e.layers.eachLayer((layer: any) => {
          const isCircle = layer instanceof L.Circle;
          const isPolygon = layer instanceof L.Polygon && !(layer instanceof L.Circle);
          if (!isCircle && !isPolygon) return;
          const zoneId = (layer as any)._monitoringZoneId as string | undefined;
          if (!zoneId) return;
          const payload = getMonitoringLayerPayload(layer as L.Circle | L.Polygon);
          onMonitoringZoneEditedRef.current?.({
            zoneId,
            ...payload,
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
