export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type HazardType = 'Flood' | 'Coastal Flood' | 'Landslide' | 'Earthquake' | 'Fire' | 'Other';
export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'resolved';

export interface HazardReport {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  hazardType: HazardType;
  urgencyLevel: UrgencyLevel;
  mediaUrl?: string;
  description?: string;
  confidenceScore: number;
  isVerified: boolean;
  status: ReportStatus;
  reporterCount: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapMarkerData {
  report: HazardReport;
  position: {
    lat: number;
    lng: number;
  };
  color: string;
  size: number;
}

export interface AdminAction {
  reportId: string;
  action: 'verify' | 'reject';
  reason?: string;
  timestamp: string;
}
