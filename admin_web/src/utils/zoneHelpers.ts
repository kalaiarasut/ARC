import type { Coordinate, Zone } from '../types/zone';

export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng,
      yi = polygon[i].lat;
    const xj = polygon[j].lng,
      yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

export function isPointInRectangle(point: Coordinate, rect: Coordinate[]): boolean {
  if (rect.length < 2) return false;

  const minLat = Math.min(rect[0].lat, rect[1].lat);
  const maxLat = Math.max(rect[0].lat, rect[1].lat);
  const minLng = Math.min(rect[0].lng, rect[1].lng);
  const maxLng = Math.max(rect[0].lng, rect[1].lng);

  return point.lat >= minLat && point.lat <= maxLat && point.lng >= minLng && point.lng <= maxLng;
}

export function isReportInsideZone(reportPoint: Coordinate, zone: Zone): boolean {
  if (zone.status !== 'active') return false;

  if (zone.shape === 'rectangle') {
    return isPointInRectangle(reportPoint, zone.coordinates);
  } else if (zone.shape === 'polygon') {
    return isPointInPolygon(reportPoint, zone.coordinates);
  }

  return false;
}

export function findZonesContainingPoint(point: Coordinate, zones: Zone[]): Zone[] {
  return zones.filter(zone => isReportInsideZone(point, zone));
}

export function calculateCenterPoint(coordinates: Coordinate[]): Coordinate {
  if (coordinates.length === 0) return { lat: 0, lng: 0 };

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
}

export function getZoneBounds(zone: Zone) {
  if (zone.coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  const lats = zone.coordinates.map(c => c.lat);
  const lngs = zone.coordinates.map(c => c.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}

export function generateZoneColor(): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function formatZoneShape(shape: 'rectangle' | 'polygon'): string {
  return shape === 'rectangle' ? 'Rectangle' : 'Polygon';
}
