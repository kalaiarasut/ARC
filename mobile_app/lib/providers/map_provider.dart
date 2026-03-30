import 'dart:math' as math;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/map_marker_data.dart';
import '../models/official_advisory.dart';
import '../models/monitoring_zone.dart';
import '../models/risk_zone.dart';
import '../core/supabase_config.dart';
import '../services/advisory_service.dart';
import '../services/map_service.dart';
import 'language_provider.dart';

double mathCosDeg(double degrees) => math.cos((degrees * math.pi) / 180);

/// Map filters state
class MapFilters{
  final Set<String> selectedHazardTypes;
  final int daysBack; // Time filter
  final bool showRiskZones;
  final bool showOnlyHighRisk;

  MapFilters({
    Set<String>? selectedHazardTypes,
    this.daysBack = 7, // Default: last 7 days
    this.showRiskZones = false, // OFF by default (per requirements)
    this.showOnlyHighRisk = false,
  }) : selectedHazardTypes = selectedHazardTypes ?? 
       {'High Waves', 'Tsunami', 'Storm', 'Flood', 'Other'};

  MapFilters copyWith({
    Set<String>? selectedHazardTypes,
    int? daysBack,
    bool? showRiskZones,
    bool? showOnlyHighRisk,
  }) {
    return MapFilters(
      selectedHazardTypes: selectedHazardTypes ?? this.selectedHazardTypes,
      daysBack: daysBack ?? this.daysBack,
      showRiskZones: showRiskZones ?? this.showRiskZones,
      showOnlyHighRisk: showOnlyHighRisk ?? this.showOnlyHighRisk,
    );
  }
}

/// Map state including data and UI state
class MapState {
  final List<MapMarkerData> markers;
  final List<OfficialAdvisory> advisories;
  final List<RiskZone> riskZones;
  final List<MonitoringZone> monitoringZones;
  final MapMarkerData? selectedMarker;
  final OfficialAdvisory? selectedAdvisory;
  final DateTime? lastUpdated;
  final bool isLoading;
  final String? error;
  final LatLngBounds? currentBounds;

  MapState({
    this.markers = const [],
    this.advisories = const [],
    this.riskZones = const [],
    this.monitoringZones = const [],
    this.selectedMarker,
    this.selectedAdvisory,
    this.lastUpdated,
    this.isLoading = false,
    this.error,
    this.currentBounds,
  });

  MapState copyWith({
    List<MapMarkerData>? markers,
    List<OfficialAdvisory>? advisories,
    List<RiskZone>? riskZones,
    List<MonitoringZone>? monitoringZones,
    MapMarkerData? selectedMarker,
    bool clearSelectedMarker = false,
    OfficialAdvisory? selectedAdvisory,
    bool clearSelectedAdvisory = false,
    DateTime? lastUpdated,
    bool? isLoading,
    String? error,
    bool clearError = false,
    LatLngBounds? currentBounds,
  }) {
    return MapState(
      markers: markers ?? this.markers,
      advisories: advisories ?? this.advisories,
      riskZones: riskZones ?? this.riskZones,
      monitoringZones: monitoringZones ?? this.monitoringZones,
      selectedMarker: clearSelectedMarker ? null : (selectedMarker ?? this.selectedMarker),
      selectedAdvisory: clearSelectedAdvisory ? null : (selectedAdvisory ?? this.selectedAdvisory),
      lastUpdated: lastUpdated ?? this.lastUpdated,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      currentBounds: currentBounds ?? this.currentBounds,
    );
  }

  /// Get freshness text
  String get freshnessText {
    if (lastUpdated == null) return 'Never updated';
    final diff = DateTime.now().difference(lastUpdated!);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    return '${diff.inDays} days ago';
  }

  /// Check if data is stale (> 10 minutes old)
  bool get isStale {
    if (lastUpdated == null) return true;
    return DateTime.now().difference(lastUpdated!).inMinutes > 10;
  }
}

/// Notifier for map data
class MapNotifier extends Notifier<MapState> {
  final MapService _mapService = MapService();
  final SupabaseClient _supabase = SupabaseConfig.client;

  RealtimeChannel? _advisoriesChannel;

  bool _isAdvisoryActive(OfficialAdvisory advisory) {
    final now = DateTime.now();
    if (advisory.startsAt != null && advisory.startsAt!.isAfter(now)) return false;
    if (advisory.expiresAt != null && advisory.expiresAt!.isBefore(now)) return false;
    return true;
  }

  Future<void> _refreshLocalizedRealtimeAdvisory(String advisoryId) async {
    if (advisoryId.trim().isEmpty) return;
    try {
      final advisory = await AdvisoryService().getById(
        advisoryId,
        languageCode: ref.read(languageCodeProvider),
      );
      if (advisory != null) {
        _upsertRealtimeAdvisory(advisory);
      }
    } catch (_) {
      // Ignore malformed payloads / transient network issues.
    }
  }

  void _upsertRealtimeAdvisory(OfficialAdvisory advisory) {
    // Only keep advisories with a location.
    if (advisory.latitude == null || advisory.longitude == null) {
      _removeRealtimeAdvisory(advisory.id);
      return;
    }

    // Filter out inactive advisories.
    if (!_isAdvisoryActive(advisory)) {
      _removeRealtimeAdvisory(advisory.id);
      return;
    }

    // If we have bounds, keep only those within the viewport.
    final bounds = state.currentBounds;
    if (bounds != null) {
      final lat = advisory.latitude!;
      final lon = advisory.longitude!;
      final inBounds =
          lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east;
      if (!inBounds) {
        _removeRealtimeAdvisory(advisory.id);
        return;
      }
    }

    final next = [...state.advisories];
    final idx = next.indexWhere((a) => a.id == advisory.id);
    if (idx >= 0) {
      next[idx] = advisory;
    } else {
      next.add(advisory);
    }
    next.sort((a, b) => b.publishedAt.compareTo(a.publishedAt));
    state = state.copyWith(advisories: next);
  }

  void _removeRealtimeAdvisory(String id) {
    if (id.isEmpty) return;
    if (state.advisories.isEmpty) return;
    final next = state.advisories.where((a) => a.id != id).toList();
    if (next.length == state.advisories.length) return;

    final shouldClearSelected = state.selectedAdvisory?.id == id;
    state = state.copyWith(
      advisories: next,
      clearSelectedAdvisory: shouldClearSelected,
    );
  }

  void _ensureRealtimeAdvisories() {
    if (_advisoriesChannel != null) return;

    _advisoriesChannel = _supabase.channel('realtime:map:official_advisories');

    _advisoriesChannel!
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'official_advisories',
          callback: (payload) async {
            final id = (payload.newRecord['id'] as String?) ?? '';
            await _refreshLocalizedRealtimeAdvisory(id);
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'official_advisories',
          callback: (payload) async {
            final id = (payload.newRecord['id'] as String?) ?? '';
            await _refreshLocalizedRealtimeAdvisory(id);
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.delete,
          schema: 'public',
          table: 'official_advisories',
          callback: (payload) {
            final old = payload.oldRecord;
            final id = (old['id'] as String?) ?? '';
            _removeRealtimeAdvisory(id);
          },
        )
        .subscribe();

    ref.onDispose(() {
      final ch = _advisoriesChannel;
      _advisoriesChannel = null;
      // ignore: discarded_futures
      ch?.unsubscribe();
    });
  }

  bool _isWithinBounds(LatLng point, LatLngBounds bounds) {
    return point.latitude >= bounds.south &&
        point.latitude <= bounds.north &&
        point.longitude >= bounds.west &&
        point.longitude <= bounds.east;
  }

  bool _passesFilters(MapMarkerData marker, MapFilters? filters) {
    if (filters == null) return true;

    if (!filters.selectedHazardTypes.contains(marker.hazardType)) {
      return false;
    }

    if (filters.showOnlyHighRisk && !marker.isHighRisk) {
      return false;
    }

    final daysDiff = DateTime.now().difference(marker.timestamp).inDays;
    if (daysDiff > filters.daysBack) {
      return false;
    }

    return true;
  }

  bool _circleIntersectsBounds({
    required double lat,
    required double lon,
    required double radiusMeters,
    required LatLngBounds bounds,
  }) {
    final latPad = radiusMeters / 111320;
    final cosLat = mathCosDeg(lat).abs().clamp(0.2, 1.0);
    final lonPad = radiusMeters / (111320 * cosLat);
    return lat + latPad >= bounds.south &&
        lat - latPad <= bounds.north &&
        lon + lonPad >= bounds.west &&
        lon - lonPad <= bounds.east;
  }

  bool _polygonIntersectsBounds(List<MonitoringZoneCoordinate> points, LatLngBounds bounds) {
    if (points.isEmpty) return false;

    var minLat = points.first.lat;
    var maxLat = points.first.lat;
    var minLng = points.first.lng;
    var maxLng = points.first.lng;

    for (final point in points.skip(1)) {
      if (point.lat < minLat) minLat = point.lat;
      if (point.lat > maxLat) maxLat = point.lat;
      if (point.lng < minLng) minLng = point.lng;
      if (point.lng > maxLng) maxLng = point.lng;
    }

    return maxLat >= bounds.south &&
        minLat <= bounds.north &&
        maxLng >= bounds.west &&
        minLng <= bounds.east;
  }

  List<MonitoringZone> _monitoringZonesInBounds(List<MonitoringZone> zones, LatLngBounds bounds) {
    return zones.where((zone) {
      if (zone.isPolygon) {
        return _polygonIntersectsBounds(zone.polygonPoints, bounds);
      }
      return _circleIntersectsBounds(
        lat: zone.centerLat,
        lon: zone.centerLng,
        radiusMeters: zone.radiusMeters,
        bounds: bounds,
      );
    }).toList();
  }

  Future<void> _loadOwnReportsForBounds({
    required LatLngBounds bounds,
    required String userId,
    MapFilters? filters,
  }) async {
    try {
      final own = await _mapService.getUserReportLocations(userId: userId, daysBack: filters?.daysBack ?? 30);
      final ownInBounds = own
          .where((m) => _isWithinBounds(m.location, bounds))
          .where((m) => _passesFilters(m, filters))
          .toList();

      if (ownInBounds.isEmpty) return;

      // Merge into existing markers, preferring own markers when IDs collide.
      final merged = <String, MapMarkerData>{
        for (final m in state.markers) m.id: m,
      };
      for (final m in ownInBounds) {
        merged[m.id] = m;
      }

      state = state.copyWith(markers: merged.values.toList());
    } catch (_) {
      // Ignore failures (offline, RLS, etc.) and keep verified markers.
    }
  }

  @override
  MapState build() {
    _ensureRealtimeAdvisories();
    return MapState();
  }

  /// Update viewport and fetch data (debounced in service)
  Future<void> updateViewport(LatLngBounds bounds, {String? currentUserId, MapFilters? filters}) async {
    state = state.copyWith(currentBounds: bounds, isLoading: true, clearError: true);

    try {
      // Use direct fetch for reports (debouncing is handled at the UI layer)
      final markers = await _mapService.getReportsInBounds(
        minLat: bounds.south,
        maxLat: bounds.north,
        minLon: bounds.west,
        maxLon: bounds.east,
        currentUserId: currentUserId,
      );

      // Apply filters
      var filteredMarkers = markers;
      if (filters != null) {
        filteredMarkers = markers.where((marker) {
          if (!filters.selectedHazardTypes.contains(marker.hazardType)) {
            return false;
          }
          if (filters.showOnlyHighRisk && !marker.isHighRisk) {
            return false;
          }
          final daysDiff = DateTime.now().difference(marker.timestamp).inDays;
          if (daysDiff > filters.daysBack) {
            return false;
          }
          return true;
        }).toList();
      }

      final advisories = await _mapService.getAdvisoriesInBounds(
        minLat: bounds.south,
        maxLat: bounds.north,
        minLon: bounds.west,
        maxLon: bounds.east,
      );
      final activeAdvisories = advisories.where(_isAdvisoryActive).toList();
      final monitoringZones = _monitoringZonesInBounds(
        await _mapService.getMonitoringZones(),
        bounds,
      );

      state = state.copyWith(
        markers: filteredMarkers,
        advisories: activeAdvisories,
        monitoringZones: monitoringZones,
        lastUpdated: DateTime.now(),
        isLoading: false,
      );

      // Overlay current user's own report locations (full precision) if available.
      if (currentUserId != null && currentUserId.isNotEmpty) {
        // Fire-and-forget: keep UI responsive.
        // ignore: discarded_futures
        _loadOwnReportsForBounds(bounds: bounds, userId: currentUserId, filters: filters);
      }

      // Fetch risk zones if enabled
      if (filters?.showRiskZones == true) {
        final riskZones = await _mapService.getCachedRiskZones(
          minLat: bounds.south,
          maxLat: bounds.north,
          minLon: bounds.west,
          maxLon: bounds.east,
        );
        state = state.copyWith(riskZones: riskZones);
      } else {
        state = state.copyWith(riskZones: []);
      }
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to load map data: $e',
        isLoading: false,
      );
    }
  }

  /// Calculate risk zones on-demand (live analysis)
  Future<void> calculateLiveRiskZones({
    required double centerLat,
    required double centerLon,
    required int zoomLevel,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final riskZones = await _mapService.calculateRiskZonesOnDemand(
        centerLat: centerLat,
        centerLon: centerLon,
        zoomLevel: zoomLevel,
      );
      
      state = state.copyWith(
        riskZones: riskZones,
        isLoading: false,
        lastUpdated: DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to calculate risk zones: $e',
        isLoading: false,
      );
    }
  }

  /// Select a marker for details view
  void selectMarker(MapMarkerData marker) {
    state = state.copyWith(selectedMarker: marker, clearSelectedAdvisory: true);
  }

  void selectAdvisory(OfficialAdvisory advisory) {
    state = state.copyWith(selectedAdvisory: advisory, clearSelectedMarker: true);
  }

  /// Clear selected marker
  void clearSelectedMarker() {
    state = state.copyWith(clearSelectedMarker: true);
  }

  void clearSelectedAdvisory() {
    state = state.copyWith(clearSelectedAdvisory: true);
  }

  void clearSelections() {
    state = state.copyWith(clearSelectedMarker: true, clearSelectedAdvisory: true);
  }

  /// Manual refresh
  Future<void> refresh({String? currentUserId, MapFilters? filters}) async {
    if (state.currentBounds != null) {
      await updateViewport(state.currentBounds!, currentUserId: currentUserId, filters: filters);
    }
  }
}

/// Providers

/// Map state provider
final mapProvider = NotifierProvider<MapNotifier, MapState>(() {
  return MapNotifier();
});

/// Map filters notifier
class MapFiltersNotifier extends Notifier<MapFilters> {
  @override
  MapFilters build() => MapFilters();

  void update(MapFilters filters) {
    state = filters;
  }
}

/// Map filters provider
final mapFiltersProvider = NotifierProvider<MapFiltersNotifier, MapFilters>(() {
  return MapFiltersNotifier();
});

/// User location notifier
class UserLocationNotifier extends Notifier<LatLng?> {
  @override
  LatLng? build() => null;

  void update(LatLng? location) {
    state = location;
  }
}

/// Current user location provider (from geolocator)
final userLocationProvider = NotifierProvider<UserLocationNotifier, LatLng?>(() {
  return UserLocationNotifier();
});

/// LatLngBounds extension for convenience
extension LatLngBoundsExtension on LatLngBounds {
  double get north => northEast.latitude;
  double get south => southWest.latitude;
  double get east => northEast.longitude;
  double get west => southWest.longitude;
}
