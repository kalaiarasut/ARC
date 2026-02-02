import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import L from 'leaflet';
import type { Map as LeafletMapInstance } from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  hazardType: 'flood' | 'fire' | 'earthquake' | 'landslide' | 'cyclone' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  timestamp: string;
}

/**
 * Leaflet marker icon configurations
 * Match with hazard urgency levels
 */
const getMarkerIcon = (urgency: string) => {
  let color = '#FFD700'; // Yellow - default

  switch (urgency) {
    case 'critical':
      color = '#FF0000'; // Red
      break;
    case 'high':
      color = '#FF6B35'; // Orange-Red
      break;
    case 'medium':
      color = '#FFA500'; // Orange
      break;
    case 'low':
      color = '#FFD700'; // Yellow
      break;
  }

  return L.divIcon({
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-weight: bold;
        font-size: 14px;
        color: white;
      ">
        📍
      </div>
    `,
    iconSize: [30, 30],
    popupAnchor: [0, -15],
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

    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

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

      const marker = L.marker([report.lat, report.lng], {
        icon: getMarkerIcon(report.urgency),
        title: report.title,
      })
        .bindPopup(`
          <div style="font-size: 12px; width: 200px;">
            <strong>${report.title}</strong><br/>
            <span style="color: #666;">Type: ${report.hazardType}</span><br/>
            <span style="color: ${report.urgency === 'critical' ? '#FF0000' : '#FFA500'};">
              Urgency: ${report.urgency.toUpperCase()}
            </span><br/>
            <small>${new Date(report.timestamp).toLocaleString()}</small>
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
          center: center as L.LatLngExpression,
          zoom: zoom,
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

        // Add scale control
        L.control.scale({ imperial: false, metric: true }).addTo(map);

        // Handle resize
        const handleMapResize = () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        };

        window.addEventListener('resize', handleMapResize);

        if (onMapReady) {
          onMapReady(map);
        }

        return () => {
          window.removeEventListener('resize', handleMapResize);
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
    }, [center, zoom, onMapReady]);

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
