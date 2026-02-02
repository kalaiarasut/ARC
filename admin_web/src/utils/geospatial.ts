/**
 * Geospatial Utility Functions
 * 
 * Future-ready functions for checking GPS locations against monitoring zones.
 * Uses Google Maps Geometry Library for accurate distance calculations.
 * 
 * Use Cases:
 * - Validate if a user's report location is inside an active monitoring zone
 * - Real-time location tracking and zone boundary alerts
 * - Batch processing of historical location data
 */

import type { MonitoringZone } from '../components/GoogleMapDashboard';

export interface GeoPoint {
    lat: number;
    lng: number;
}

/**
 * Check if a point (GPS coordinate) is inside a circular monitoring zone
 * 
 * @param point - The GPS coordinate to check (e.g., user's location)
 * @param zone - The monitoring zone to check against
 * @returns true if the point is inside the zone, false otherwise
 * 
 * @example
 * const userLocation = { lat: 13.08, lng: 80.27 };
 * const zone = {
 *   center_lat: 13.08,
 *   center_lng: 80.27,
 *   radius_meters: 5000
 * };
 * 
 * if (isPointInZone(userLocation, zone)) {
 *   console.log('User is inside the monitoring zone');
 * }
 */
export function isPointInZone(point: GeoPoint, zone: MonitoringZone): boolean {
    // Use Haversine formula for accurate distance calculation
    const distance = calculateDistance(
        point.lat,
        point.lng,
        zone.center_lat,
        zone.center_lng
    );

    return distance <= zone.radius_meters;
}

/**
 * Check if a point is inside ANY of the provided zones
 * 
 * @param point - The GPS coordinate to check
 * @param zones - Array of monitoring zones
 * @returns The first zone that contains the point, or null if none
 * 
 * @example
 * const userLocation = { lat: 13.08, lng: 80.27 };
 * const zones = [...]; // Array of monitoring zones
 * 
 * const containingZone = findContainingZone(userLocation, zones);
 * if (containingZone) {
 *   console.log(`User is in zone ${containingZone.id}`);
 * }
 */
export function findContainingZone(
    point: GeoPoint,
    zones: MonitoringZone[]
): MonitoringZone | null {
    for (const zone of zones) {
        if (isPointInZone(point, zone)) {
            return zone;
        }
    }
    return null;
}

/**
 * Check if a point is inside ANY of the provided zones (returns all matching zones)
 * 
 * @param point - The GPS coordinate to check
 * @param zones - Array of monitoring zones
 * @returns Array of zones that contain the point
 */
export function findAllContainingZones(
    point: GeoPoint,
    zones: MonitoringZone[]
): MonitoringZone[] {
    return zones.filter((zone) => isPointInZone(point, zone));
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 * 
 * This is a standalone implementation that doesn't require Google Maps to be loaded
 * Accurate for most use cases (error < 0.5%)
 * 
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Calculate distance using Google Maps Geometry Library (if available)
 * More accurate than Haversine for very precise calculations
 * 
 * @param point1 - First GPS coordinate
 * @param point2 - Second GPS coordinate
 * @returns Distance in meters, or null if Google Maps not loaded
 * 
 * @example
 * const p1 = { lat: 13.08, lng: 80.27 };
 * const p2 = { lat: 13.09, lng: 80.28 };
 * const distance = calculateDistanceWithGoogle(p1, p2);
 * if (distance !== null) {
 *   console.log(`Distance: ${distance.toFixed(2)} meters`);
 * }
 */
export function calculateDistanceWithGoogle(
    point1: GeoPoint,
    point2: GeoPoint
): number | null {
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps?.geometry?.spherical) {
        console.warn(
            'Google Maps Geometry Library not loaded. Using Haversine formula instead.'
        );
        return calculateDistance(point1.lat, point1.lng, point2.lat, point2.lng);
    }

    const p1 = new google.maps.LatLng(point1.lat, point1.lng);
    const p2 = new google.maps.LatLng(point2.lat, point2.lng);

    return google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
}

/**
 * Validate GPS coordinates
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns true if coordinates are valid
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
}

/**
 * Check if coordinates are within India's approximate bounding box
 * Useful for quick validation of report locations
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns true if coordinates are roughly within India
 */
export function isInIndia(lat: number, lng: number): boolean {
    // Approximate bounding box for India (including territories)
    const INDIA_BOUNDS = {
        north: 35.5,
        south: 6.5,
        east: 97.5,
        west: 68.0,
    };

    return (
        lat >= INDIA_BOUNDS.south &&
        lat <= INDIA_BOUNDS.north &&
        lng >= INDIA_BOUNDS.west &&
        lng <= INDIA_BOUNDS.east
    );
}

/**
 * Format distance for display
 * 
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "1.5 km" or "250 m")
 */
export function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
}

/**
 * Calculate the closest zone to a given point
 * 
 * @param point - GPS coordinate
 * @param zones - Array of monitoring zones
 * @returns Object with the closest zone and distance, or null if no zones
 */
export function findClosestZone(
    point: GeoPoint,
    zones: MonitoringZone[]
): { zone: MonitoringZone; distance: number } | null {
    if (zones.length === 0) return null;

    let closestZone = zones[0];
    let minDistance = calculateDistance(
        point.lat,
        point.lng,
        closestZone.center_lat,
        closestZone.center_lng
    );

    for (let i = 1; i < zones.length; i++) {
        const distance = calculateDistance(
            point.lat,
            point.lng,
            zones[i].center_lat,
            zones[i].center_lng
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestZone = zones[i];
        }
    }

    return { zone: closestZone, distance: minDistance };
}

/**
 * Example usage for validating hazard reports
 * This demonstrates how to use the functions in a real-world scenario
 */
export class HazardReportValidator {
    private activeZones: MonitoringZone[] = [];

    constructor(zones: MonitoringZone[]) {
        this.activeZones = zones;
    }

    /**
     * Validate if a hazard report location is inside any active monitoring zone
     */
    validateReportLocation(reportLat: number, reportLng: number): {
        isValid: boolean;
        zone: MonitoringZone | null;
        reason: string;
    } {
        // First check if coordinates are valid
        if (!isValidCoordinate(reportLat, reportLng)) {
            return {
                isValid: false,
                zone: null,
                reason: 'Invalid GPS coordinates',
            };
        }

        // Check if within India (optional validation)
        if (!isInIndia(reportLat, reportLng)) {
            return {
                isValid: false,
                zone: null,
                reason: 'Location is outside India',
            };
        }

        // Check if inside any monitoring zone
        const containingZone = findContainingZone(
            { lat: reportLat, lng: reportLng },
            this.activeZones
        );

        if (containingZone) {
            return {
                isValid: true,
                zone: containingZone,
                reason: 'Location is inside an active monitoring zone',
            };
        }

        // Find closest zone for helpful error message
        const closest = findClosestZone(
            { lat: reportLat, lng: reportLng },
            this.activeZones
        );

        const distanceMsg = closest
            ? ` (closest zone is ${formatDistance(closest.distance)} away)`
            : '';

        return {
            isValid: false,
            zone: null,
            reason: `Location is outside all monitoring zones${distanceMsg}`,
        };
    }

    /**
     * Update the list of active zones
     */
    updateZones(zones: MonitoringZone[]): void {
        this.activeZones = zones;
    }
}
