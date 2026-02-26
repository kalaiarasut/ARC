import 'dart:async';
import 'package:flutter_map_tile_caching/flutter_map_tile_caching.dart';
import 'package:latlong2/latlong.dart';

/// Service for managing offline map tile caching via FMTC.
class TileCachingService {
  static const String _defaultStoreName = 'civilAlertMapStore';

  static bool _initialized = false;

  /// Initialize FMTC backend. Call once before runApp().
  static Future<void> initialize() async {
    if (_initialized) return;
    await FMTCObjectBoxBackend().initialise();
    // Ensure default store exists for browse caching
    await FMTCStore(_defaultStoreName).manage.create();
    _initialized = true;
  }

  /// Get the default store name for map tiles.
  static String get storeName => _defaultStoreName;

  /// Get cache statistics for the default store.
  static Future<({int tileCount, double sizeMB})> getCacheStats() async {
    final store = FMTCStore(_defaultStoreName);
    final stats = await store.stats.all;
    return (
      tileCount: stats.tileCount,
      sizeMB: stats.size / 1024, // size is in KB, convert to MB
    );
  }

  /// List all named stores (offline regions).
  static Future<List<StoreInfo>> getDownloadedRegions() async {
    final stores = await FMTCRoot.stats.storesAvailable;
    final List<StoreInfo> result = [];
    for (final store in stores) {
      final stats = await store.stats.all;
      result.add(StoreInfo(
        name: store.storeName,
        tileCount: stats.tileCount,
        sizeMB: stats.size / 1024,
      ));
    }
    return result;
  }

  /// Download tiles for a circular region.
  /// Returns a stream of download progress.
  static Stream<DownloadProgress> downloadRegion({
    required String name,
    required LatLng center,
    required double radiusKm,
    int minZoom = 10,
    int maxZoom = 16,
  }) {
    final store = FMTCStore(name);

    // Create store if it doesn't exist
    store.manage.create();

    final region = CircleRegion(center, radiusKm);

    return store.download.startForeground(
      region: region.toDownloadable(
        minZoom: minZoom,
        maxZoom: maxZoom,
        options: TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.ocean.civil_alert_system',
        ),
      ),
    );
  }

  /// Delete a named store (offline region).
  static Future<void> deleteRegion(String name) async {
    final store = FMTCStore(name);
    await store.manage.delete();
  }

  /// Delete all cached tiles across all stores.
  static Future<void> clearAll() async {
    await FMTCRoot.external(pathSuffix: '').reset();
    // Recreate default store
    await FMTCStore(_defaultStoreName).manage.create();
  }
}

/// Info about a downloaded offline region.
class StoreInfo {
  final String name;
  final int tileCount;
  final double sizeMB;

  const StoreInfo({
    required this.name,
    required this.tileCount,
    required this.sizeMB,
  });
}
