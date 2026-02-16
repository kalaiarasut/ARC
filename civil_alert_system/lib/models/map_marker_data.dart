import 'package:latlong2/latlong.dart';

/// Simplified data for displaying hazard markers on map
/// Contains only necessary fields to prevent exposing sensitive data
class MapMarkerData {
  final String id;
  final LatLng location; // Already reduced precision
  final String hazardType;
  final String urgencyLevel;
  final DateTime timestamp;
  final bool isHighRisk;
  final bool isOwnReport; // true if this is the current user's report
  final List<String> mediaUrls;
  final String description;

  MapMarkerData({
    required this.id,
    required this.location,
    required this.hazardType,
    required this.urgencyLevel,
    required this.timestamp,
    this.isHighRisk = false,
    this.isOwnReport = false,
    this.mediaUrls = const [],
    this.description = '',
  });

  /// Get icon based on hazard type
  String get iconPath {
    switch (hazardType) {
      case 'High Waves':
        return 'assets/icons/waves.png';
      case 'Tsunami':
        return 'assets/icons/tsunami.png';
      case 'Storm':
        return 'assets/icons/storm.png';
      case 'Flood':
        return 'assets/icons/flood.png';
      default:
        return 'assets/icons/hazard.png';
    }
  }

  /// Get color based on urgency level
  int get urgencyColor {
    switch (urgencyLevel.toLowerCase()) {
      case 'high':
        return 0xFFF44336; // Red
      case 'medium':
        return 0xFFFF9800; // Orange
      case 'low':
      default:
        return 0xFF4CAF50; // Green
    }
  }

  /// Get time since report
  String get timeAgo {
    final diff = DateTime.now().difference(timestamp);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
