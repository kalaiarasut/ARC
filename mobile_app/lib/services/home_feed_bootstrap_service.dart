import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../models/map_marker_data.dart';
import 'map_service.dart';

enum HomeFeedWindow { now, week, month }

class HomeFeedBootstrapData {
  final HomeFeedWindow window;
  final List<MapMarkerData> reports;
  final LatLng? userLocation;

  const HomeFeedBootstrapData({
    required this.window,
    required this.reports,
    required this.userLocation,
  });
}

class HomeFeedBootstrapService {
  final MapService _mapService;

  HomeFeedBootstrapService({MapService? mapService}) : _mapService = mapService ?? MapService();

  Future<HomeFeedBootstrapData> resolveInitialHomeFeed() async {
    final userLocation = await _tryGetLastKnownLocation();
    const fallbackOrder = [HomeFeedWindow.now, HomeFeedWindow.week, HomeFeedWindow.month];

    HomeFeedWindow resolvedWindow = HomeFeedWindow.month;
    List<MapMarkerData> resolvedReports = const [];

    for (final window in fallbackOrder) {
      final reports = await _fetchReportsForWindow(window, userLocation: userLocation);
      resolvedWindow = window;
      resolvedReports = reports;
      if (reports.isNotEmpty) break;
    }

    return HomeFeedBootstrapData(
      window: resolvedWindow,
      reports: resolvedReports,
      userLocation: userLocation,
    );
  }

  Future<LatLng?> _tryGetLastKnownLocation() async {
    try {
      final perm = await Geolocator.checkPermission();
      final hasPermission = perm == LocationPermission.always || perm == LocationPermission.whileInUse;
      if (!hasPermission) return null;

      final pos = await Geolocator.getLastKnownPosition();
      if (pos == null) return null;
      return LatLng(pos.latitude, pos.longitude);
    } catch (_) {
      return null;
    }
  }

  DateTime _sinceForWindow(HomeFeedWindow window) {
    final now = DateTime.now();
    switch (window) {
      case HomeFeedWindow.week:
        return now.subtract(const Duration(days: 7));
      case HomeFeedWindow.month:
        return now.subtract(const Duration(days: 30));
      case HomeFeedWindow.now:
        return now.subtract(const Duration(hours: 24));
    }
  }

  double _deltaDegreesForWindow(HomeFeedWindow window) {
    switch (window) {
      case HomeFeedWindow.week:
        return 1.8;
      case HomeFeedWindow.month:
        return 3.5;
      case HomeFeedWindow.now:
        return 0.9;
    }
  }

  Future<List<MapMarkerData>> _fetchReportsForWindow(
    HomeFeedWindow window, {
    required LatLng? userLocation,
  }) async {
    try {
      final since = _sinceForWindow(window);

      double minLat = -90, maxLat = 90, minLon = -180, maxLon = 180;
      if (userLocation != null) {
        final d = _deltaDegreesForWindow(window);
        minLat = (userLocation.latitude - d).clamp(-90, 90);
        maxLat = (userLocation.latitude + d).clamp(-90, 90);
        minLon = (userLocation.longitude - d).clamp(-180, 180);
        maxLon = (userLocation.longitude + d).clamp(-180, 180);
      }

      final items = await _mapService.getReportsInBounds(
        minLat: minLat,
        maxLat: maxLat,
        minLon: minLon,
        maxLon: maxLon,
        limit: 200,
      );

      final filtered = items.where((r) => r.timestamp.isAfter(since)).toList()
        ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

      return filtered.take(10).toList();
    } catch (_) {
      return const [];
    }
  }
}
