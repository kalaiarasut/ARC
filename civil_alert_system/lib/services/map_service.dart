import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_config.dart';
import '../models/hazard_report.dart';
import '../models/risk_zone.dart';
import '../models/map_marker_data.dart';

/// Service for handling map-specific data fetching
/// Implements debouncing and caching for performance
class MapService {
  final SupabaseClient _supabase = SupabaseConfig.client;

  // Debounce timer for viewport changes
  Timer? _debounceTimer;
  static const _debounceDuration = Duration(milliseconds: 500);

  // Client-side rate limiting for on-demand calculations
  DateTime? _lastOnDemandCalculation;
  static const _onDemandCooldown = Duration(seconds: 3);

  /// Fetch verified reports within viewport bounds with debouncing
  /// Returns reports with reduced precision coordinates (~100m grid)
  Future<List<MapMarkerData>> getReportsInBounds({
    required double minLat,
    required double maxLat,
    required double minLon,
    required double maxLon,
    int limit = 100,
    String? currentUserId,
  }) async {
    try {
      // Enforce client-side limit (server will also enforce 200 max)
      final safeLimit = limit > 200 ? 200 : limit;

      final response = await _supabase.rpc(
        'get_verified_reports_in_bounds',
        params: {
          'min_lat': minLat,
          'max_lat': maxLat,
          'min_lon': minLon,
          'max_lon': maxLon,
          'requested_limit': safeLimit,
        },
      );

      final reports = (response as List)
          .map((json) => HazardReport.fromJson(json))
          .toList();

      // Convert to map markers with privacy protection
      return reports.map((report) {
        final isOwnReport = currentUserId != null && report.userId == currentUserId;
        return report.toMapMarker(isOwnReport: isOwnReport);
      }).toList();
    } catch (e) {
      // Offline or network error - return empty list for graceful degradation
      print('Error fetching reports in bounds: $e');
      return [];
    }
  }

  /// Fetch cached risk zones (default, fast)
  /// Updated every 5-10 minutes on server
  Future<List<RiskZone>> getCachedRiskZones({
    required double minLat,
    required double maxLat,
    required double minLon,
    required double maxLon,
  }) async {
    try {
      final response = await _supabase.rpc(
        'get_cached_risk_zones',
        params: {
          'min_lat': minLat,
          'max_lat': maxLat,
          'min_lon': minLon,
          'max_lon': maxLon,
        },
      );

      return (response as List)
          .map((json) => RiskZone.fromJson(json, isCached: true))
          .toList();
    } catch (e) {
      print('Error fetching cached risk zones: $e');
      return [];
    }
  }

  /// Calculate risk zones on-demand (real-time, expensive)
  /// Use only when user explicitly requests "Live analysis"
  /// Rate-limited to prevent abuse
  Future<List<RiskZone>> calculateRiskZonesOnDemand({
    required double centerLat,
    required double centerLon,
    required int zoomLevel,
  }) async {
    // Check rate limit
    if (_lastOnDemandCalculation != null) {
      final timeSinceLastCalc = DateTime.now().difference(_lastOnDemandCalculation!);
      if (timeSinceLastCalc < _onDemandCooldown) {
        print('Rate limit: Please wait ${_onDemandCooldown.inSeconds}s between calculations');
        return [];
      }
    }

    try {
      _lastOnDemandCalculation = DateTime.now();

      final response = await _supabase.rpc(
        'calculate_risk_zones_on_demand',
        params: {
          'center_lat': centerLat,
          'center_lon': centerLon,
          'zoom_level': zoomLevel,
        },
      );

      return (response as List)
          .map((json) => RiskZone.fromJson(json, isCached: false))
          .toList();
    } catch (e) {
      print('Error calculating risk zones on-demand: $e');
      return [];
    }
  }

  /// Fetch current user's own reports for map display
  /// Optional time filter to avoid cluttering with old reports
  Future<List<MapMarkerData>> getUserReportLocations({
    required String userId,
    int daysBack = 30,
  }) async {
    try {
      final response = await _supabase.rpc(
        'get_user_reports_on_map',
        params: {
          'user_uuid': userId,
          'days_back': daysBack,
        },
      );

      final reports = (response as List)
          .map((json) => HazardReport.fromJson(json))
          .toList();

      // All reports from this call are own reports
      return reports.map((report) => report.toMapMarker(isOwnReport: true)).toList();
    } catch (e) {
      print('Error fetching user reports: $e');
      return [];
    }
  }

  /// Debounced viewport update
  /// Cancels previous pending request and schedules new one after delay
  Future<List<MapMarkerData>> debouncedGetReportsInBounds({
    required double minLat,
    required double maxLat,
    required double minLon,
    required double maxLon,
    int limit = 100,
    String? currentUserId,
    required Function(List<MapMarkerData>) onComplete,
  }) async {
    // Cancel previous timer
    _debounceTimer?.cancel();

    // Create completer for async return
    final completer = Completer<List<MapMarkerData>>();

    // Schedule new request after debounce delay
    _debounceTimer = Timer(_debounceDuration, () async {
      final reports = await getReportsInBounds(
        minLat: minLat,
        maxLat: maxLat,
        minLon: minLon,
        maxLon: maxLon,
        limit: limit,
        currentUserId: currentUserId,
      );
      onComplete(reports);
      completer.complete(reports);
    });

    return completer.future;
  }

  /// Convenience method to refresh all map data at once
  Future<MapData> refreshMapData({
    required double minLat,
    required double maxLat,
    required double minLon,
    required double maxLon,
    String? currentUserId,
    bool includeRiskZones = false,
  }) async {
    final reports = await getReportsInBounds(
      minLat: minLat,
      maxLat: maxLat,
      minLon: minLon,
      maxLon: maxLon,
      currentUserId: currentUserId,
    );

    List<RiskZone> riskZones = [];
    if (includeRiskZones) {
      riskZones = await getCachedRiskZones(
        minLat: minLat,
        maxLat: maxLat,
        minLon: minLon,
        maxLon: maxLon,
      );
    }

    return MapData(
      markers: reports,
      riskZones: riskZones,
      lastUpdated: DateTime.now(),
    );
  }

  /// Cancel any pending debounced requests
  void dispose() {
    _debounceTimer?.cancel();
  }
}

/// Container for map data
class MapData {
  final List<MapMarkerData> markers;
  final List<RiskZone> riskZones;
  final DateTime lastUpdated;

  MapData({
    required this.markers,
    required this.riskZones,
    required this.lastUpdated,
  });

  /// Get freshness text for display
  String get freshnessText {
    final diff = DateTime.now().difference(lastUpdated);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    return '${diff.inDays} days ago';
  }

  /// Check if data is stale (> 10 minutes old)
  bool get isStale {
    return DateTime.now().difference(lastUpdated).inMinutes > 10;
  }
}
