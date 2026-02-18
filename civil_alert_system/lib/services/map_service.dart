import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:latlong2/latlong.dart';
import '../core/supabase_config.dart';
import '../models/risk_zone.dart';
import '../models/map_marker_data.dart';
import '../models/official_advisory.dart';

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

      // RPC returns a privacy-safe shape, not a full HazardReport.
      final markers = (response as List).map((row) {
        final json = row as Map<String, dynamic>;
        final id = json['id'] as String;
        final hazardType = json['hazard_type'] as String;
        final urgencyLevel = (json['urgency_level'] as String?) ?? 'Low';
        final description = (json['description'] as String?) ?? '';
        final latitude = (json['latitude'] as num).toDouble();
        final longitude = (json['longitude'] as num).toDouble();
        final isHighRisk = json['is_high_risk'] as bool? ?? false;

        final mediaRaw = json['media_urls'];
        final mediaUrls = mediaRaw is List
            ? mediaRaw.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList()
            : const <String>[];

        // Prefer event_time; fall back to created_at.
        final tsRaw = (json['event_time'] ?? json['created_at']) as String;
        final timestamp = DateTime.parse(tsRaw);

        return MapMarkerData(
          id: id,
          location: LatLng(latitude, longitude),
          hazardType: hazardType,
          urgencyLevel: urgencyLevel,
          timestamp: timestamp,
          isHighRisk: isHighRisk,
          // Own-report highlighting comes from a different RPC (get_user_reports_on_map)
          // so leave false here.
          isOwnReport: false,
          mediaUrls: mediaUrls,
          description: description,
        );
      }).toList();

      // Some RPC versions may omit description; best-effort backfill.
      final missingDescriptionIds = markers
          .where((m) => m.description.trim().isEmpty)
          .map((m) => m.id)
          .toList();

      if (missingDescriptionIds.isEmpty) return markers;

      try {
        final rows = await _supabase
            .from('hazard_reports')
            .select('id, description')
            .inFilter('id', missingDescriptionIds)
            .eq('status', 'verified');

        final byId = <String, String>{};
        for (final row in (rows as List)) {
          final json = row as Map<String, dynamic>;
          final id = json['id']?.toString();
          final description = (json['description'] as String?)?.trim() ?? '';
          if (id != null && description.isNotEmpty) {
            byId[id] = description;
          }
        }

        return markers
            .map((m) => byId.containsKey(m.id)
                ? MapMarkerData(
                    id: m.id,
                    location: m.location,
                    hazardType: m.hazardType,
                    urgencyLevel: m.urgencyLevel,
                    timestamp: m.timestamp,
                    isHighRisk: m.isHighRisk,
                    isOwnReport: m.isOwnReport,
                    mediaUrls: m.mediaUrls,
                    description: byId[m.id]!,
                  )
                : m)
            .toList();
      } catch (_) {
        return markers;
      }
    } catch (e) {
      // Offline or network error - return empty list for graceful degradation
      return [];
    }
  }

  /// Fetch official advisories with a location inside the viewport.
  /// This is intentionally lightweight (latest first) and filtered client-side by bounds.
  Future<List<OfficialAdvisory>> getAdvisoriesInBounds({
    required double minLat,
    required double maxLat,
    required double minLon,
    required double maxLon,
    int limit = 100,
  }) async {
    try {
      final safeLimit = limit > 300 ? 300 : (limit < 1 ? 1 : limit);

      final response = await _supabase
          .from('official_advisories')
          .select(
              'id,title,body,region,severity,category,latitude,longitude,starts_at,expires_at,contact_phone,contact_whatsapp,contact_hotline,published_at')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .gte('latitude', minLat)
          .lte('latitude', maxLat)
          .gte('longitude', minLon)
          .lte('longitude', maxLon)
          .order('published_at', ascending: false)
          .limit(safeLimit);

      final list = (response as List)
          .map((json) => OfficialAdvisory.fromJson(json as Map<String, dynamic>))
          .where((a) => a.latitude != null && a.longitude != null)
          .toList();

      return list;
    } catch (_) {
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
      debugPrint('getCachedRiskZones failed: $e');
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

      // RPC returns a limited, safe shape. Convert directly.
      return (response as List).map((row) {
        final json = row as Map<String, dynamic>;
        final id = json['id'] as String;
        final hazardType = json['hazard_type'] as String;
        final urgencyLevel = (json['urgency_level'] as String?) ?? 'Low';
        final description = (json['description'] as String?) ?? '';
        final latitude = (json['latitude'] as num).toDouble();
        final longitude = (json['longitude'] as num).toDouble();
        final isHighRisk = json['is_high_risk'] as bool? ?? false;
        final tsRaw = (json['event_time'] ?? json['created_at']) as String;
        final timestamp = DateTime.parse(tsRaw);

        return MapMarkerData(
          id: id,
          location: LatLng(latitude, longitude),
          hazardType: hazardType,
          urgencyLevel: urgencyLevel,
          timestamp: timestamp,
          isHighRisk: isHighRisk,
          isOwnReport: true,
          description: description,
        );
      }).toList();
    } catch (e) {
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
