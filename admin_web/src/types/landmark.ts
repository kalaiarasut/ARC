export interface Landmark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius?: number; // in meters, optional search radius
  createdAt: string;
}

export interface LandmarkFilter {
  landmarkId: string;
  radius: number; // in meters
}
