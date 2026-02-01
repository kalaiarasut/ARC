import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart';
import '../models/map_marker_data.dart';
import '../models/risk_zone.dart';
import '../services/map_service.dart';

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
  final List<RiskZone> riskZones;
  final MapMarkerData? selectedMarker;
  final DateTime? lastUpdated;
  final bool isLoading;
  final String? error;
  final LatLngBounds? currentBounds;

  MapState({
    this.markers = const [],
    this.riskZones = const [],
    this.selectedMarker,
    this.lastUpdated,
    this.isLoading = false,
    this.error,
    this.currentBounds,
  });

  MapState copyWith({
    List<MapMarkerData>? markers,
    List<RiskZone>? riskZones,
    MapMarkerData? selectedMarker,
    bool clearSelectedMarker = false,
    DateTime? lastUpdated,
    bool? isLoading,
    String? error,
    bool clearError = false,
    LatLngBounds? currentBounds,
  }) {
    return MapState(
      markers: markers ?? this.markers,
      riskZones: riskZones ?? this.riskZones,
      selectedMarker: clearSelectedMarker ? null : (selectedMarker ?? this.selectedMarker),
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

  @override
  MapState build() => MapState();

  /// Update viewport and fetch data (debounced in service)
  Future<void> updateViewport(LatLngBounds bounds, {String? currentUserId, MapFilters? filters}) async {
    state = state.copyWith(currentBounds: bounds, isLoading: true, clearError: true);

    try {
      // Use debounced fetch
      await _mapService.debouncedGetReportsInBounds(
        minLat: bounds.south,
        maxLat: bounds.north,
        minLon: bounds.west,
        maxLon: bounds.east,
        currentUserId: currentUserId,
        onComplete: (markers) {
          // Apply filters
          var filteredMarkers = markers;
          
          if (filters != null) {
            filteredMarkers = markers.where((marker) {
              // Hazard type filter
              if (!filters.selectedHazardTypes.contains(marker.hazardType)) {
                return false;
              }
              
              // High risk only filter
              if (filters.showOnlyHighRisk && !marker.isHighRisk) {
                return false;
              }
              
              // Time filter
              final daysDiff = DateTime.now().difference(marker.timestamp).inDays;
              if (daysDiff > filters.daysBack) {
                return false;
              }
              
              return true;
            }).toList();
          }

          state = state.copyWith(
            markers: filteredMarkers,
            lastUpdated: DateTime.now(),
            isLoading: false,
          );
        },
      );

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
    state = state.copyWith(selectedMarker: marker);
  }

  /// Clear selected marker
  void clearSelectedMarker() {
    state = state.copyWith(clearSelectedMarker: true);
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
