import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_marker_cluster/flutter_map_marker_cluster.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_map_tile_caching/flutter_map_tile_caching.dart';

import '../services/tile_caching_service.dart';
import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import '../core/supabase_config.dart';
import '../providers/map_provider.dart';
import '../providers/language_provider.dart';
import '../models/map_marker_data.dart';
import '../models/monitoring_zone.dart';
import '../models/official_advisory.dart';
import '../models/advisory_category.dart';
import 'report_details_screen.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen>
    with WidgetsBindingObserver {
  final MapController _mapController = MapController();
  final LayerHitNotifier<MonitoringZone> _monitoringZonePolygonHitNotifier =
      ValueNotifier(null);
  final LayerHitNotifier<MonitoringZone> _monitoringZoneCircleHitNotifier =
      ValueNotifier(null);
  LatLng? _userLocation;
  double? _userAccuracyMeters;
  bool _isLoadingLocation = true;
  bool _showFilters = false;
  bool _isFetchingLocation = false;
  bool _hasPromptedForGps = false;
  bool _hasPromptedForPermissionSettings = false;
  StreamSubscription<ServiceStatus>? _serviceStatusSub;
  Timer? _debounceTimer;
  ProviderSubscription<String>? _languageSub;
  MonitoringZone? _selectedMonitoringZone;

  double _markerScale = 1.0;
  double _lastZoom = -1;

  double _computeMarkerScale(double zoom) {
    // Gentle scaling so markers feel responsive but not huge.
    // Base: zoom 14 => 1.0; zoom +/-8 => x2 or x0.5
    const baseZoom = 14.0;
    final raw = math.pow(2, (zoom - baseZoom) / 8.0).toDouble();
    return raw.clamp(0.65, 1.35);
  }

  Future<void> _openDirectionsTo(double lat, double lon) async {
    // Use Google Maps directions with destination only; Google Maps will default origin to current location.
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lon',
    );
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.l10n.couldNotOpenMaps)));
    }
  }

  Future<Position?> _getBestPosition({
    Duration timeout = const Duration(seconds: 12),
    double goodEnoughAccuracyMeters = 25,
  }) async {
    Position? best = await Geolocator.getLastKnownPosition();

    final completer = Completer<Position?>();
    StreamSubscription<Position>? sub;
    try {
      final settings = const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 0,
      );

      sub = Geolocator.getPositionStream(locationSettings: settings).listen(
        (pos) {
          if (best == null || pos.accuracy < best!.accuracy) {
            best = pos;
          }
          if (!completer.isCompleted &&
              pos.accuracy <= goodEnoughAccuracyMeters) {
            completer.complete(pos);
          }
        },
        onError: (_) {
          if (!completer.isCompleted) completer.complete(best);
        },
      );

      final result = await Future.any<Position?>([
        completer.future,
        Future<Position?>.delayed(timeout, () => best),
      ]);

      return result ?? best;
    } catch (_) {
      return best;
    } finally {
      await sub?.cancel();
    }
  }

  Future<void> _refreshUserLocationAndCenter() async {
    // Allow re-prompting if user previously dismissed dialogs.
    _hasPromptedForGps = false;
    _hasPromptedForPermissionSettings = false;
    await getUserLocation(promptForGpsIfOff: true);
    if (!mounted) return;
    recenterMap();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _serviceStatusSub = Geolocator.getServiceStatusStream().listen((status) {
      if (!mounted) return;

      // When user enables GPS from settings, re-attempt location fetch.
      if (status == ServiceStatus.enabled) {
        getUserLocation(promptForGpsIfOff: false);
      }
    });

    getUserLocation();

    _languageSub = ref.listenManual<String>(languageCodeProvider, (
      previous,
      next,
    ) {
      if (previous != null &&
          previous != next &&
          ref.read(mapProvider).currentBounds != null) {
        // ignore: discarded_futures
        ref.read(mapProvider.notifier).refresh();
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _serviceStatusSub?.cancel();
    _debounceTimer?.cancel();
    _languageSub?.close();
    _monitoringZonePolygonHitNotifier.dispose();
    _monitoringZoneCircleHitNotifier.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Returning from system settings: re-check services/permissions.
      getUserLocation(promptForGpsIfOff: false);
    }
  }

  void _scheduleMapRefresh({bool recenter = false}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (recenter) {
        recenterMap();
      }
      updateMapData();
    });
  }

  void _setFallbackLocation() {
    if (!mounted) return;
    setState(() {
      _userLocation ??= LatLng(12.9716, 77.5946); // Bangalore fallback
      _isLoadingLocation = false;
    });
    _scheduleMapRefresh(recenter: true);
  }

  Future<bool> promptEnableLocationServices() async {
    if (!mounted) return false;
    if (_hasPromptedForGps) return false;
    _hasPromptedForGps = true;

    // Ensure we are past the first build before showing dialogs/snackbars.
    await Future<void>.delayed(Duration.zero);
    if (!mounted) return false;

    final shouldOpenSettings = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n.locationServicesOffTitle),
        content: Text(context.l10n.enableLocationServicesForCurrentLocation),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(context.l10n.notNow),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(context.l10n.openSettings),
          ),
        ],
      ),
    );

    if (shouldOpenSettings == true) {
      await Geolocator.openLocationSettings();
      return true;
    }

    return false;
  }

  Future<bool> promptOpenAppSettingsForPermission() async {
    if (!mounted) return false;
    if (_hasPromptedForPermissionSettings) return false;
    _hasPromptedForPermissionSettings = true;

    await Future<void>.delayed(Duration.zero);
    if (!mounted) return false;

    final shouldOpenSettings = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n.permissionRequiredTitle),
        content: Text(
          context.l10n.locationPermissionPermanentlyDeniedForCurrentLocation,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(context.l10n.notNow),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(context.l10n.openSettings),
          ),
        ],
      ),
    );

    if (shouldOpenSettings == true) {
      await Geolocator.openAppSettings();
      return true;
    }

    return false;
  }

  Future<void> getUserLocation({bool promptForGpsIfOff = true}) async {
    if (_isFetchingLocation) return;
    if (mounted) {
      setState(() => _isFetchingLocation = true);
    } else {
      _isFetchingLocation = true;
    }

    try {
      // Step 1: Check if location services (GPS) are enabled
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (promptForGpsIfOff) {
          await promptEnableLocationServices();
        }

        if (mounted) {
          await Future<void>.delayed(Duration.zero);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  context.l10n.enableLocationServicesForCurrentLocation,
                ),
              ),
            );
          }
        }
        _setFallbackLocation();
        return;
      }

      // Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied) {
        if (mounted) {
          await Future<void>.delayed(Duration.zero);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  context.l10n.locationPermissionDeniedAllowForCurrentLocation,
                ),
              ),
            );
          }
        }
        _setFallbackLocation();
        return;
      }

      if (permission == LocationPermission.deniedForever) {
        await promptOpenAppSettingsForPermission();

        if (mounted) {
          await Future<void>.delayed(Duration.zero);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  context.l10n.locationPermissionBlockedEnableInSettings,
                ),
              ),
            );
          }
        }
        _setFallbackLocation();
        return;
      }

      // Optional: use last known position for faster initial UI
      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null && mounted && _userLocation == null) {
        setState(() {
          _userAccuracyMeters = lastKnown.accuracy;
          _userLocation = LatLng(lastKnown.latitude, lastKnown.longitude);
          ref.read(userLocationProvider.notifier).update(_userLocation);
          _isLoadingLocation = false;
        });
        _scheduleMapRefresh(recenter: true);
      }

      // Get a more precise fix: sample stream briefly and pick best accuracy.
      final position =
          await _getBestPosition(timeout: const Duration(seconds: 12)) ??
          await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.bestForNavigation,
            timeLimit: const Duration(seconds: 12),
          );

      setState(() {
        _userAccuracyMeters = position.accuracy;
        _userLocation = LatLng(position.latitude, position.longitude);
        ref.read(userLocationProvider.notifier).update(_userLocation);
        _isLoadingLocation = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
      }

      // Recenter & initial data fetch once the map is laid out
      _scheduleMapRefresh(recenter: true);
    } catch (e) {
      _setFallbackLocation();
      if (mounted) {
        await Future<void>.delayed(Duration.zero);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.l10n.errorGettingLocationWithError(e.toString()),
              ),
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isFetchingLocation = false);
      } else {
        _isFetchingLocation = false;
      }
      if (mounted && _isLoadingLocation) {
        setState(() => _isLoadingLocation = false);
      }
    }
  }

  void updateMapData() {
    if (_userLocation == null) return;

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      if (!mounted) return;
      final bounds = _mapController.camera.visibleBounds;
      final filters = ref.read(mapFiltersProvider);

      ref
          .read(mapProvider.notifier)
          .updateViewport(
            bounds,
            currentUserId: SupabaseConfig.client.auth.currentSession?.user.id ?? SupabaseConfig.client.auth.currentUser?.id,
            filters: filters,
          );
    });
  }

  void _clearOverlaySelections() {
    ref.read(mapProvider.notifier).clearSelections();
    if (_selectedMonitoringZone != null && mounted) {
      setState(() => _selectedMonitoringZone = null);
    }
  }

  void _selectMonitoringZoneFromHitNotifiers() {
    final circleHit = _monitoringZoneCircleHitNotifier.value;
    final polygonHit = _monitoringZonePolygonHitNotifier.value;
    final zone = (circleHit != null && circleHit.hitValues.isNotEmpty)
        ? circleHit.hitValues.first
        : (polygonHit != null && polygonHit.hitValues.isNotEmpty)
        ? polygonHit.hitValues.first
        : null;

    if (zone == null) {
      _clearOverlaySelections();
      return;
    }

    ref.read(mapProvider.notifier).clearSelections();
    if (mounted) {
      setState(() => _selectedMonitoringZone = zone);
    }
  }

  void onMapEvent(MapEvent event) {
    final zoom = _mapController.camera.zoom;
    if (_lastZoom < 0 || (zoom - _lastZoom).abs() >= 0.01) {
      final newScale = _computeMarkerScale(zoom);
      _lastZoom = zoom;
      if (mounted && (_markerScale - newScale).abs() >= 0.03) {
        setState(() {
          _markerScale = newScale;
        });
      }
    }

    if (event is MapEventMoveEnd || event is MapEventRotateEnd) {
      updateMapData();
    }
  }

  void recenterMap() {
    if (_userLocation != null) {
      _mapController.move(_userLocation!, 14);
    }
  }

  // Risk zone prompting intentionally deferred until admin/dashboard work is ready.

  @override
  Widget build(BuildContext context) {
    final mapState = ref.watch(mapProvider);
    final filters = ref.watch(mapFiltersProvider);

    if (_isLoadingLocation) {
      return Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: AppColors.primaryBlue),
              const SizedBox(height: 16),
              Text(
                context.l10n.gettingYourLocation,
                style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkTextSecondary
                      : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Theme.of(context).cardColor,
      body: Stack(
        children: [
          // Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter:
                  _userLocation ?? LatLng(20.5937, 78.9629), // India center
              initialZoom: _userLocation != null ? 14 : 5,
              minZoom: 5,
              maxZoom: 18,
              onMapEvent: onMapEvent,
              onTap: (tapPosition, point) {
                _clearOverlaySelections();
              },
            ),
            children: [
              // Base map tiles (with offline caching)
              if (Theme.of(context).brightness == Brightness.dark)
                ColorFiltered(
                  colorFilter: const ColorFilter.matrix(<double>[
                    -1,
                    0,
                    0,
                    0,
                    255,
                    0,
                    -1,
                    0,
                    0,
                    255,
                    0,
                    0,
                    -1,
                    0,
                    255,
                    0,
                    0,
                    0,
                    1,
                    0,
                  ]),
                  child: TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.ocean.civil_alert_system',
                    maxZoom: 19,
                    tileProvider: FMTCStore(TileCachingService.storeName)
                        .getTileProvider(
                          settings: FMTCTileProviderSettings(
                            behavior: CacheBehavior.cacheFirst,
                          ),
                        ),
                  ),
                )
              else
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.ocean.civil_alert_system',
                  maxZoom: 19,
                  tileProvider: FMTCStore(TileCachingService.storeName)
                      .getTileProvider(
                        settings: FMTCTileProviderSettings(
                          behavior: CacheBehavior.cacheFirst,
                        ),
                      ),
                ),

              if (mapState.monitoringZones.isNotEmpty)
                GestureDetector(
                  onTap: _selectMonitoringZoneFromHitNotifiers,
                  child: Stack(
                    children: [
                      if (mapState.monitoringZones.any(
                        (zone) => zone.isPolygon,
                      ))
                        PolygonLayer(
                          hitNotifier: _monitoringZonePolygonHitNotifier,
                          polygons: _buildMonitoringZonePolygons(
                            mapState.monitoringZones,
                          ),
                        ),
                      if (mapState.monitoringZones.any((zone) => zone.isCircle))
                        CircleLayer(
                          hitNotifier: _monitoringZoneCircleHitNotifier,
                          circles: _buildMonitoringZoneCircles(
                            mapState.monitoringZones,
                          ),
                        ),
                    ],
                  ),
                ),

              // Risk zones (if enabled)
              if (filters.showRiskZones && mapState.riskZones.isNotEmpty)
                ...mapState.riskZones.map(
                  (zone) => CircleLayer(
                    circles: [
                      CircleMarker(
                        point: LatLng(zone.latitude, zone.longitude),
                        radius: zone.radiusMeters,
                        useRadiusInMeter: true,
                        color: zone.color,
                        borderColor: zone.color.withOpacity(0.8),
                        borderStrokeWidth: 2,
                      ),
                    ],
                  ),
                ),

              // Hazard markers with clustering
              MarkerClusterLayerWidget(
                options: MarkerClusterLayerOptions(
                  maxClusterRadius: 100,
                  size: Size(50 * _markerScale, 50 * _markerScale),
                  markers: mapState.markers.map((markerData) {
                    return Marker(
                      point: markerData.location,
                      width: 40 * _markerScale,
                      height: 50 * _markerScale,
                      child: GestureDetector(
                        onTap: () {
                          if (_selectedMonitoringZone != null) {
                            setState(() => _selectedMonitoringZone = null);
                          }
                          ref
                              .read(mapProvider.notifier)
                              .selectMarker(markerData);
                        },
                        child: Transform.scale(
                          scale: _markerScale,
                          alignment: Alignment.bottomCenter,
                          child: buildMarkerWidget(markerData),
                        ),
                      ),
                    );
                  }).toList(),
                  builder: (context, markers) {
                    return Container(
                      decoration: BoxDecoration(
                        color: AppColors.primaryBlue,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white,
                          width: 3 * _markerScale,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 8 * _markerScale,
                            offset: Offset(0, 2 * _markerScale),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          '${markers.length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ).copyWith(fontSize: 16 * _markerScale),
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Advisory markers with clustering (official updates)
              if (mapState.advisories.isNotEmpty)
                MarkerClusterLayerWidget(
                  options: MarkerClusterLayerOptions(
                    maxClusterRadius: 100,
                    size: Size(50 * _markerScale, 50 * _markerScale),
                    markers: mapState.advisories
                        .where((a) => a.latitude != null && a.longitude != null)
                        .map((advisory) {
                          return Marker(
                            point: LatLng(
                              advisory.latitude!,
                              advisory.longitude!,
                            ),
                            width: 40 * _markerScale,
                            height: 50 * _markerScale,
                            child: GestureDetector(
                              onTap: () {
                                if (_selectedMonitoringZone != null) {
                                  setState(
                                    () => _selectedMonitoringZone = null,
                                  );
                                }
                                ref
                                    .read(mapProvider.notifier)
                                    .selectAdvisory(advisory);
                              },
                              child: Transform.scale(
                                scale: _markerScale,
                                alignment: Alignment.bottomCenter,
                                child: buildAdvisoryMarkerWidget(advisory),
                              ),
                            ),
                          );
                        })
                        .toList(),
                    builder: (context, markers) {
                      return Container(
                        decoration: BoxDecoration(
                          color: AppColors.secondaryCyan,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white,
                            width: 3 * _markerScale,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 8 * _markerScale,
                              offset: Offset(0, 2 * _markerScale),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            '${markers.length}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ).copyWith(fontSize: 16 * _markerScale),
                          ),
                        ),
                      );
                    },
                  ),
                ),

              // User location marker
              if (_userLocation != null)
                CircleLayer(
                  circles: [
                    if (_userAccuracyMeters != null)
                      CircleMarker(
                        point: _userLocation!,
                        // Clamp to avoid massive circles on bad GPS.
                        radius: (_userAccuracyMeters!.clamp(
                          10,
                          1000,
                        )).toDouble(),
                        useRadiusInMeter: true,
                        color: AppColors.primaryBlue.withOpacity(0.12),
                        borderColor: AppColors.primaryBlue.withOpacity(0.25),
                        borderStrokeWidth: 1.5,
                      ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _userLocation!,
                    width: 20,
                    height: 20,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.primaryBlue,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryBlue.withOpacity(0.3),
                            blurRadius: 12,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Top overlay - Freshness indicator & filters
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                margin: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Material(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkElevated.withOpacity(0.95)
                          : Colors.white.withOpacity(0.95),
                      elevation: 2,
                      borderRadius: BorderRadius.circular(999),
                      child: IconButton(
                        icon: Icon(
                          Icons.arrow_back_ios_new,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.white
                              : AppColors.textPrimary,
                          size: 18,
                        ),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Freshness indicator
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: mapState.isStale
                            ? AppColors.warning.withOpacity(0.95)
                            : Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkElevated.withOpacity(0.95)
                            : Colors.white.withOpacity(0.95),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.schedule,
                            size: 16,
                            color: mapState.isStale
                                ? Colors.white
                                : (Theme.of(context).brightness ==
                                          Brightness.dark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.textSecondary),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            mapState.freshnessText,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: mapState.isStale
                                  ? Colors.white
                                  : (Theme.of(context).brightness ==
                                            Brightness.dark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.textSecondary),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const Spacer(),

                    // Filter toggle button
                    Material(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkElevated.withOpacity(0.95)
                          : Colors.white.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(12),
                      elevation: 4,
                      child: InkWell(
                        onTap: () =>
                            setState(() => _showFilters = !_showFilters),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          child: Icon(
                            _showFilters ? Icons.close : Icons.tune,
                            color:
                                Theme.of(context).brightness == Brightness.dark
                                ? AppColors.darkPrimaryBlue
                                : AppColors.primaryBlue,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Filter panel (collapsible)
          if (_showFilters)
            Positioned(
              top: 80,
              left: 16,
              right: 16,
              child: SafeArea(
                child: Material(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(20),
                  elevation: 8,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          context.l10n.filtersTitle,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color:
                                Theme.of(context).brightness == Brightness.dark
                                ? AppColors.darkTextPrimary
                                : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Time range filter
                        Text(
                          context.l10n.timeRangeTitle,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color:
                                Theme.of(context).brightness == Brightness.dark
                                ? AppColors.darkTextSecondary
                                : AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: [1, 7, 30].map((days) {
                            final isSelected = filters.daysBack == days;
                            return ChoiceChip(
                              label: Text(
                                days == 1
                                    ? context.l10n.twentyFourHours
                                    : context.l10n.daysNumber(days),
                                style: TextStyle(
                                  color: isSelected
                                      ? Colors.white
                                      : AppColors.textSecondary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              selected: isSelected,
                              onSelected: (selected) {
                                if (selected) {
                                  ref
                                      .read(mapFiltersProvider.notifier)
                                      .update(filters.copyWith(daysBack: days));
                                  updateMapData();
                                }
                              },
                              selectedColor: AppColors.primaryBlue,
                              backgroundColor: Colors.grey[200],
                            );
                          }).toList(),
                        ),

                        const SizedBox(height: 16),

                        // Risk zones toggle
                        SwitchListTile(
                          title: Text(
                            context.l10n.showRiskZonesTitle,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            context.l10n.displayHazardHotspots,
                            style: const TextStyle(fontSize: 12),
                          ),
                          value: filters.showRiskZones,
                          activeColor: AppColors.primaryBlue,
                          onChanged: (value) async {
                            final nextFilters = filters.copyWith(
                              showRiskZones: value,
                            );
                            ref
                                .read(mapFiltersProvider.notifier)
                                .update(nextFilters);

                            // Force a fetch immediately (no need to wait for a moveend).
                            final bounds = _mapController.camera.visibleBounds;
                            await ref
                                .read(mapProvider.notifier)
                                .updateViewport(
                                  bounds,
                                  currentUserId: SupabaseConfig
                                      .client
                                      .auth
                                      .currentUser
                                      ?.id,
                                  filters: nextFilters,
                                );
                            if (!context.mounted) return;
                            // Give users feedback when there are no verified zones available.
                            if (value == true &&
                                ref.read(mapProvider).riskZones.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    context.l10n.noVerifiedRiskZones,
                                  ),
                                  duration: const Duration(seconds: 3),
                                ),
                              );
                            }
                          },
                        ),

                        // High risk only toggle
                        SwitchListTile(
                          title: Text(
                            context.l10n.highRiskOnlyTitle,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            context.l10n.showOnlyCriticalReports,
                            style: const TextStyle(fontSize: 12),
                          ),
                          value: filters.showOnlyHighRisk,
                          activeColor: AppColors.error,
                          onChanged: (value) {
                            ref
                                .read(mapFiltersProvider.notifier)
                                .update(
                                  filters.copyWith(showOnlyHighRisk: value),
                                );
                            updateMapData();
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

          // Recenter FAB
          Positioned(
            bottom:
                (mapState.selectedMarker != null ||
                    mapState.selectedAdvisory != null ||
                    _selectedMonitoringZone != null)
                ? 280
                : 100,
            right: 16,
            child: FloatingActionButton(
              onPressed: _isFetchingLocation
                  ? null
                  : _refreshUserLocationAndCenter,
              backgroundColor: _isFetchingLocation
                  ? Colors.grey[200]
                  : Theme.of(context).cardColor,
              elevation: 4,
              child: _isFetchingLocation
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: AppColors.primaryBlue,
                      ),
                    )
                  : const Icon(Icons.my_location, color: AppColors.primaryBlue),
            ),
          ),

          // Loading indicator
          if (mapState.isLoading)
            Positioned(
              bottom: 16,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primaryBlue,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        context.l10n.loadingText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Bottom sheet for selected marker
          if (mapState.selectedMarker != null)
            _buildMarkerDetailsSheet(mapState.selectedMarker!),

          if (mapState.selectedAdvisory != null)
            buildAdvisoryDetailsSheet(mapState.selectedAdvisory!),

          if (_selectedMonitoringZone != null)
            _buildMonitoringZoneDetailsSheet(_selectedMonitoringZone!),
        ],
      ),
    );
  }

  Widget buildMarkerWidget(MapMarkerData marker) {
    return Column(
      children: [
        SizedBox(
          width: 40,
          height: 40,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Color(marker.urgencyColor),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: marker.isOwnReport
                        ? AppColors.primaryBlue
                        : Colors.white,
                    width: marker.isOwnReport ? 3 : 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  getHazardIcon(marker.hazardType),
                  color: Colors.white,
                  size: 20,
                ),
              ),
              if (marker.isOwnReport)
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.primaryBlue,
                        width: 2,
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.person,
                        size: 10,
                        color: AppColors.primaryBlue,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        // Pointer triangle
        CustomPaint(
          size: const Size(10, 10),
          painter: _TrianglePainter(Color(marker.urgencyColor)),
        ),
      ],
    );
  }

  IconData getHazardIcon(String hazardType) {
    switch (hazardType) {
      case 'High Waves':
        return Icons.waves;
      case 'Tsunami':
        return Icons.flood;
      case 'Storm':
        return Icons.thunderstorm;
      case 'Flood':
        return Icons.water_damage;
      default:
        return Icons.warning;
    }
  }

  Color _monitoringZoneColor(int peopleCount) {
    if (peopleCount >= 50) return const Color(0xFFFF9800);
    if (peopleCount >= 30) return const Color(0xFFF44336);
    if (peopleCount >= 20) return const Color(0xFFFFC107);
    return const Color(0xFF4CAF50);
  }

  List<Polygon<MonitoringZone>> _buildMonitoringZonePolygons(
    List<MonitoringZone> zones,
  ) {
    return zones.where((zone) => zone.isPolygon).map((zone) {
      final color = _monitoringZoneColor(zone.peopleCount);
      return Polygon(
        points: zone.polygonPoints
            .map((point) => LatLng(point.lat, point.lng))
            .toList(),
        color: color.withOpacity(0.14),
        borderColor: color.withOpacity(0.9),
        borderStrokeWidth: 2,
        hitValue: zone,
      );
    }).toList();
  }

  List<CircleMarker<MonitoringZone>> _buildMonitoringZoneCircles(
    List<MonitoringZone> zones,
  ) {
    return zones.where((zone) => zone.isCircle).map((zone) {
      final color = _monitoringZoneColor(zone.peopleCount);
      return CircleMarker(
        point: LatLng(zone.centerLat, zone.centerLng),
        radius: zone.radiusMeters,
        useRadiusInMeter: true,
        color: color.withOpacity(0.14),
        borderColor: color.withOpacity(0.9),
        borderStrokeWidth: 2,
        hitValue: zone,
      );
    }).toList();
  }

  String _monitoringZoneTypeLabel(MonitoringZone zone) {
    return zone.isPolygon
        ? 'Polygon monitoring zone'
        : 'Circular monitoring zone';
  }

  String _monitoringZoneSummary(MonitoringZone zone) {
    if (zone.isPolygon) {
      return '${zone.polygonPoints.length} boundary points. ${zone.peopleCount} people currently inside.';
    }
    final radius = zone.radiusMeters >= 1000
        ? '${(zone.radiusMeters / 1000).toStringAsFixed(zone.radiusMeters % 1000 == 0 ? 0 : 1)} km radius'
        : '${zone.radiusMeters.round()} m radius';
    return '$radius. ${zone.peopleCount} people currently inside.';
  }

  Widget _buildMonitoringZoneDetailsSheet(MonitoringZone zone) {
    final color = _monitoringZoneColor(zone.peopleCount);
    final detailRows = <Widget>[
      _buildMonitoringZoneDetailRow(
        Icons.category_outlined,
        'Type',
        _monitoringZoneTypeLabel(zone),
      ),
      _buildMonitoringZoneDetailRow(
        Icons.people_alt_outlined,
        'People in zone',
        '${zone.peopleCount}',
      ),
      if (zone.isCircle)
        _buildMonitoringZoneDetailRow(
          Icons.radio_button_checked,
          'Radius',
          zone.radiusMeters >= 1000
              ? '${(zone.radiusMeters / 1000).toStringAsFixed(zone.radiusMeters % 1000 == 0 ? 0 : 1)} km'
              : '${zone.radiusMeters.round()} m',
        ),
      if (zone.isPolygon)
        _buildMonitoringZoneDetailRow(
          Icons.polyline,
          'Boundary points',
          '${zone.polygonPoints.length}',
        ),
      _buildMonitoringZoneDetailRow(
        Icons.schedule,
        'Created',
        '${zone.createdAt.day.toString().padLeft(2, '0')}/${zone.createdAt.month.toString().padLeft(2, '0')}/${zone.createdAt.year}',
      ),
    ];

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: const [
            BoxShadow(
              color: Colors.black26,
              blurRadius: 20,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.16),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        zone.isPolygon
                            ? Icons.polyline
                            : Icons.radio_button_checked,
                        color: color,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            zone.name,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color:
                                  Theme.of(context).brightness ==
                                      Brightness.dark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _monitoringZoneTypeLabel(zone),
                            style: TextStyle(
                              fontSize: 13,
                              color:
                                  Theme.of(context).brightness ==
                                      Brightness.dark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  _monitoringZoneSummary(zone),
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.4,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkTextSecondary
                        : AppColors.textSecondary,
                  ),
                ),
                if (zone.description.trim().isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    zone.description.trim(),
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.45,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextPrimary
                          : AppColors.textPrimary,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                ...detailRows,
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      if (mounted) {
                        setState(() => _selectedMonitoringZone = null);
                      }
                    },
                    icon: const Icon(Icons.close, size: 18),
                    label: Text(context.l10n.close),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: const BorderSide(color: AppColors.greyOutline),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMonitoringZoneDetailRow(
    IconData icon,
    String label,
    String value,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 16,
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextSecondary
                : AppColors.textSecondary,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: TextStyle(
                  fontSize: 14,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkTextPrimary
                      : AppColors.textPrimary,
                ),
                children: [
                  TextSpan(
                    text: '$label: ',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  TextSpan(text: value),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color getAdvisoryColor(String category) {
    switch (advisoryCategoryFromString(category)) {
      case AdvisoryCategory.food:
        return AppColors.success;
      case AdvisoryCategory.shelter:
        return AppColors.primaryBlue;
      case AdvisoryCategory.medical:
        return AppColors.error;
      case AdvisoryCategory.rescue:
        return const Color(0xFF6A1B9A); // Purple
      case AdvisoryCategory.roadblock:
        return const Color(0xFF5D4037); // Brown
      case AdvisoryCategory.warning:
        return const Color(0xFFFF9800); // Orange
      case AdvisoryCategory.evacuation:
        return const Color(0xFFD32F2F); // Red
      case AdvisoryCategory.unknown:
        return AppColors.secondaryCyan;
    }
  }

  IconData getAdvisoryIcon(String category) {
    switch (advisoryCategoryFromString(category)) {
      case AdvisoryCategory.food:
        return Icons.restaurant;
      case AdvisoryCategory.shelter:
        return Icons.home;
      case AdvisoryCategory.medical:
        return Icons.medical_services;
      case AdvisoryCategory.rescue:
        return Icons.volunteer_activism;
      case AdvisoryCategory.roadblock:
        return Icons.block;
      case AdvisoryCategory.warning:
        return Icons.warning_amber;
      case AdvisoryCategory.evacuation:
        return Icons.directions_run;
      case AdvisoryCategory.unknown:
        return Icons.campaign;
    }
  }

  Widget buildAdvisoryMarkerWidget(OfficialAdvisory advisory) {
    final color = getAdvisoryColor(advisory.category);
    final languageCode = Localizations.localeOf(context).languageCode;
    final categoryLabel = advisoryCategoryLabelForLanguage(
      advisoryCategoryFromString(advisory.category),
      languageCode,
    );

    return Column(
      children: [
        SizedBox(
          width: 40,
          height: 40,
          child: Container(
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Stack(
              children: [
                Center(
                  child: Icon(
                    getAdvisoryIcon(advisory.category),
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                Positioned(
                  left: 6,
                  bottom: 4,
                  right: 6,
                  child: Text(
                    categoryLabel.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 7,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 1,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        CustomPaint(size: const Size(10, 10), painter: _TrianglePainter(color)),
      ],
    );
  }

  Widget buildAdvisoryDetailsSheet(OfficialAdvisory advisory) {
    final color = getAdvisoryColor(advisory.category);
    final languageCode = Localizations.localeOf(context).languageCode;
    final categoryLabel = advisoryCategoryLabelForLanguage(
      advisoryCategoryFromString(advisory.category),
      languageCode,
    );
    final validityParts = <String>[];
    if (advisory.startsAt != null) {
      validityParts.add(
        '${advisoryLabelForLanguage('starts', languageCode)}: ${advisory.startsAt!.toLocal()}',
      );
    }
    if (advisory.expiresAt != null) {
      validityParts.add(
        '${advisoryLabelForLanguage('expires', languageCode)}: ${advisory.expiresAt!.toLocal()}',
      );
    }

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: Colors.black26,
              blurRadius: 20,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        getAdvisoryIcon(advisory.category),
                        color: color,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            advisory.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color:
                                  Theme.of(context).brightness ==
                                      Brightness.dark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: color.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  categoryLabel,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: color,
                                  ),
                                ),
                              ),
                              if ((advisory.region ?? '').isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[100],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    advisory.region!,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color:
                                          Theme.of(context).brightness ==
                                              Brightness.dark
                                          ? AppColors.darkTextSecondary
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                Text(
                  advisory.body,
                  maxLines: 6,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkTextSecondary
                        : AppColors.textSecondary,
                    height: 1.35,
                  ),
                ),

                if (validityParts.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.event,
                        size: 16,
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          validityParts.join(' • '),
                          style: TextStyle(
                            fontSize: 13,
                            color:
                                Theme.of(context).brightness == Brightness.dark
                                ? AppColors.darkTextSecondary
                                : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                if ((advisory.contactPhone ?? '').isNotEmpty ||
                    (advisory.contactWhatsapp ?? '').isNotEmpty ||
                    (advisory.contactHotline ?? '').isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    advisoryLabelForLanguage('contacts', languageCode),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  if ((advisory.contactPhone ?? '').isNotEmpty)
                    Text(
                      '${advisoryLabelForLanguage('phone', languageCode)}: ${advisory.contactPhone}',
                      style: TextStyle(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                    ),
                  if ((advisory.contactWhatsapp ?? '').isNotEmpty)
                    Text(
                      '${advisoryLabelForLanguage('whatsapp', languageCode)}: ${advisory.contactWhatsapp}',
                      style: TextStyle(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                    ),
                  if ((advisory.contactHotline ?? '').isNotEmpty)
                    Text(
                      '${advisoryLabelForLanguage('hotline', languageCode)}: ${advisory.contactHotline}',
                      style: TextStyle(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                    ),
                ],

                const SizedBox(height: 20),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          ref
                              .read(mapProvider.notifier)
                              .clearSelectedAdvisory();
                        },
                        icon: const Icon(Icons.close, size: 18),
                        label: Text(context.l10n.close),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.textSecondary,
                          side: const BorderSide(color: AppColors.greyOutline),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                    if (advisory.latitude != null &&
                        advisory.longitude != null) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            final lat = advisory.latitude;
                            final lon = advisory.longitude;
                            if (lat == null || lon == null) return;
                            // ignore: discarded_futures
                            _openDirectionsTo(lat, lon);
                          },
                          icon: const Icon(Icons.directions, size: 18),
                          label: Text(
                            advisoryLabelForLanguage(
                              'directions',
                              languageCode,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.secondaryCyan,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMarkerDetailsSheet(MapMarkerData marker) {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: const [
            BoxShadow(
              color: Colors.black26,
              blurRadius: 20,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Icon(
                      getHazardIcon(marker.hazardType),
                      color: Color(marker.urgencyColor),
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        marker.hazardType,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? AppColors.darkTextPrimary
                              : AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 16,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextSecondary
                          : AppColors.textSecondary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      marker.timeAgo,
                      style: TextStyle(
                        fontSize: 14,
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          ref.read(mapProvider.notifier).clearSelectedMarker();
                        },
                        icon: const Icon(Icons.close, size: 18),
                        label: Text(context.l10n.close),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.textSecondary,
                          side: const BorderSide(color: AppColors.greyOutline),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ReportDetailsScreen(
                                reportId: marker.id,
                                isOwnReport: marker.isOwnReport,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.info_outline, size: 18),
                        label: Text(context.l10n.moreDetails),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryBlue,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TrianglePainter extends CustomPainter {
  final Color color;
  const _TrianglePainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = ui.Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_TrianglePainter oldDelegate) =>
      oldDelegate.color != color;
}
