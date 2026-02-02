import 'dart:ui';

/// Model for risk zone/hotspot data
/// Represents areas with clustered hazard reports
class RiskZone {
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final String intensity; // 'low' | 'medium' | 'high'
  final int reportCount;
  final double intensityScore; // Raw score for debugging
  final DateTime calculatedAt;
  final bool isCached; // true if from cache, false if on-demand

  RiskZone({
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
    required this.intensity,
    required this.reportCount,
    required this.intensityScore,
    required this.calculatedAt,
    this.isCached = true,
  });

  /// Create from Supabase response
  factory RiskZone.fromJson(Map<String, dynamic> json, {bool isCached = true}) {
    return RiskZone(
      latitude: (json['center_lat'] as num).toDouble(),
      longitude: (json['center_lon'] as num).toDouble(),
      radiusMeters: (json['radius_meters'] as num).toDouble(),
      intensity: json['intensity'] as String,
      reportCount: json['report_count'] as int,
      intensityScore: (json['intensity_score'] as num).toDouble(),
      calculatedAt: json['calculated_at'] != null
          ? DateTime.parse(json['calculated_at'] as String)
          : DateTime.now(),
      isCached: isCached,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'center_lat': latitude,
      'center_lon': longitude,
      'radius_meters': radiusMeters,
      'intensity': intensity,
      'report_count': reportCount,
      'intensity_score': intensityScore,
      'calculated_at': calculatedAt.toIso8601String(),
    };
  }

  /// Get color for risk zone overlay based on intensity
  Color get color {
    switch (intensity) {
      case 'low':
        return const Color(0x4DFFEB3B); // Yellow with 30% opacity
      case 'medium':
        return const Color(0x66FF9800); // Orange with 40% opacity
      case 'high':
        return const Color(0x80F44336); // Red with 50% opacity
      default:
        return const Color(0x4DFFEB3B);
    }
  }

  /// Get display text for intensity
  String get intensityText {
    switch (intensity) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      default:
        return 'Unknown';
    }
  }

  /// Get time since calculation
  String get freshnessText {
    final diff = DateTime.now().difference(calculatedAt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    return '${diff.inDays} days ago';
  }

  /// Check if data is stale (> 10 minutes old)
  bool get isStale {
    return DateTime.now().difference(calculatedAt).inMinutes > 10;
  }
}
