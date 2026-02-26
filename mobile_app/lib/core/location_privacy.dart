import 'dart:math';
import 'package:latlong2/latlong.dart';

/// Helper class for location privacy
/// Reduces coordinate precision to prevent exposing exact locations
class LocationPrivacy {
  /// Snaps coordinates to ~100m grid for privacy
  /// Rounds to 3 decimal places (approximately 100 meters)
  static LatLng reducePrecision(double lat, double lon) {
    return LatLng(
      _roundToDecimals(lat, 3),
      _roundToDecimals(lon, 3),
    );
  }

  /// Round a number to specified decimal places
  static double _roundToDecimals(double value, int decimals) {
    final multiplier = pow(10, decimals);
    return (value * multiplier).round() / multiplier;
  }
}
