import type { Landmark } from '../types/landmark';

const STORAGE_KEY = 'ocean_hazard_landmarks';

export const landmarkService = {
  // Get all landmarks
  getLandmarks(): Landmark[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Add a new landmark
  addLandmark(landmark: Omit<Landmark, 'id' | 'createdAt'>): Landmark {
    const landmarks = this.getLandmarks();
    const newLandmark: Landmark = {
      ...landmark,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    landmarks.push(newLandmark);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(landmarks));
    return newLandmark;
  },

  // Delete a landmark
  deleteLandmark(id: string): void {
    const landmarks = this.getLandmarks().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(landmarks));
  },

  // Update a landmark
  updateLandmark(id: string, updates: Partial<Omit<Landmark, 'id' | 'createdAt'>>): Landmark | null {
    const landmarks = this.getLandmarks();
    const index = landmarks.findIndex(l => l.id === id);
    if (index === -1) return null;
    
    landmarks[index] = { ...landmarks[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(landmarks));
    return landmarks[index];
  },

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  },

  // Check if a point is within a landmark's radius
  isWithinLandmark(
    pointLat: number,
    pointLon: number,
    landmark: Landmark,
    radius?: number
  ): boolean {
    const distance = this.calculateDistance(
      pointLat,
      pointLon,
      landmark.latitude,
      landmark.longitude
    );
    return distance <= (radius || landmark.radius || 5000); // default 5km
  },
};
