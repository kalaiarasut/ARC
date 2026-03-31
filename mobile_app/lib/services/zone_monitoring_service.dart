import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/supabase_config.dart';
import 'android_workmanager_report_sync.dart';
import 'device_id_service.dart';
import 'fcm_push_service.dart';
import 'notification_service.dart';
import 'zone_monitoring_settings_service.dart';

enum ZoneMonitoringMode {
  unsupported,
  disabled,
  signedOut,
  locationServicesOff,
  locationDenied,
  foregroundOnly,
  backgroundActive,
}

class ZoneMonitoringStatus {
  final ZoneMonitoringMode mode;
  final bool enabled;

  const ZoneMonitoringStatus({
    required this.mode,
    required this.enabled,
  });

  bool get allowsForeground =>
      mode == ZoneMonitoringMode.foregroundOnly ||
      mode == ZoneMonitoringMode.backgroundActive;
}

class ZoneMonitoringService with WidgetsBindingObserver {
  ZoneMonitoringService._();

  static final ZoneMonitoringService instance = ZoneMonitoringService._();

  final SupabaseClient _supabase = SupabaseConfig.client;
  final ZoneMonitoringSettingsService _settings = ZoneMonitoringSettingsService();
  StreamSubscription<Position>? _positionSub;
  StreamSubscription<AuthState>? _authSub;
  DateTime? _lastForegroundHeartbeatAt;
  AppLifecycleState _appLifecycleState = AppLifecycleState.resumed;
  bool _started = false;

  static const Duration _foregroundHeartbeatDebounce = Duration(seconds: 30);

  bool get _isAndroid => Platform.isAndroid;

  Future<void> start() async {
    if (!_isAndroid || _started) return;
    _started = true;
    WidgetsBinding.instance.addObserver(this);

    _authSub = _supabase.auth.onAuthStateChange.listen((_) {
      unawaited(_restart());
    });

    await _restart();
  }

  Future<void> dispose() async {
    if (!_started) return;
    _started = false;
    WidgetsBinding.instance.removeObserver(this);
    await _authSub?.cancel();
    _authSub = null;
    await _stopForegroundMonitoring();
  }

  Future<ZoneMonitoringStatus> enable() async {
    if (!_isAndroid) {
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.unsupported,
        enabled: false,
      );
    }

    await _settings.setEnabled(true);
    await NotificationService.instance.initialize();
    await NotificationService.instance.requestPermissionIfNeeded();
    try {
      await FcmPushService.instance.enable();
    } catch (_) {
      // Keep monitoring enabled even if push bootstrap fails.
    }

    if (!await Geolocator.isLocationServiceEnabled()) {
      await _restart();
      return getStatus();
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) {
      await _restart();
      return getStatus();
    }

    try {
      await Permission.locationAlways.request();
    } catch (_) {
      // Best effort only. Foreground-only mode is still valid.
    }

    await _restart();
    return getStatus();
  }

  Future<void> disable() async {
    await _settings.setEnabled(false);
    _lastForegroundHeartbeatAt = null;
    await _restart();
  }

  Future<ZoneMonitoringStatus> getStatus() async {
    if (!_isAndroid) {
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.unsupported,
        enabled: false,
      );
    }

    final enabled = await _settings.isEnabled();
    if (!enabled) {
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.disabled,
        enabled: false,
      );
    }

    if (_supabase.auth.currentUser == null) {
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.signedOut,
        enabled: true,
      );
    }

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.locationServicesOff,
        enabled: true,
      );
    }

    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.locationDenied,
        enabled: true,
      );
    }

    if (permission == LocationPermission.always) {
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.backgroundActive,
        enabled: true,
      );
    }

    return const ZoneMonitoringStatus(
      mode: ZoneMonitoringMode.foregroundOnly,
      enabled: true,
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _appLifecycleState = state;
    if (!_started) return;

    if (state == AppLifecycleState.resumed) {
      unawaited(_restart());
    } else if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached ||
        state == AppLifecycleState.hidden) {
      unawaited(_stopForegroundMonitoring());
    }
  }

  Future<void> _restart() async {
    await _stopForegroundMonitoring();

    final status = await getStatus();
    if (!status.enabled || status.mode == ZoneMonitoringMode.signedOut) {
      await AndroidWorkmanagerReportSync.cancelZoneMonitoring();
      return;
    }

    if (status.mode == ZoneMonitoringMode.backgroundActive) {
      await AndroidWorkmanagerReportSync.registerZoneMonitoring();
    } else {
      await AndroidWorkmanagerReportSync.cancelZoneMonitoring();
    }

    if (status.allowsForeground && _appLifecycleState == AppLifecycleState.resumed) {
      await _startForegroundMonitoring();
    }
  }

  Future<void> _startForegroundMonitoring() async {
    await _stopForegroundMonitoring();

    Position? initialPosition;
    try {
      initialPosition = await Geolocator.getLastKnownPosition();
    } catch (_) {
      initialPosition = null;
    }

    if (initialPosition != null) {
      await _maybeSendForegroundHeartbeat(initialPosition, force: true);
    }

    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 50,
    );

    _positionSub = Geolocator.getPositionStream(locationSettings: locationSettings).listen(
      (position) {
        unawaited(_maybeSendForegroundHeartbeat(position));
      },
      onError: (Object error) {
        if (kDebugMode) {
          // ignore: avoid_print
          print('Zone monitoring stream failed: $error');
        }
      },
    );
  }

  Future<void> _stopForegroundMonitoring() async {
    await _positionSub?.cancel();
    _positionSub = null;
  }

  Future<void> _maybeSendForegroundHeartbeat(Position position, {bool force = false}) async {
    final now = DateTime.now();
    if (!force &&
        _lastForegroundHeartbeatAt != null &&
        now.difference(_lastForegroundHeartbeatAt!) < _foregroundHeartbeatDebounce) {
      return;
    }

    _lastForegroundHeartbeatAt = now;
    try {
      await sendHeartbeatForPosition(position, source: 'foreground');
    } catch (error) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Zone monitoring foreground heartbeat failed: $error');
      }
    }
  }

  static Future<void> sendHeartbeatForPosition(
    Position position, {
    required String source,
  }) async {
    final userId = SupabaseConfig.client.auth.currentUser?.id;
    if (userId == null) return;

    final deviceId = await DeviceIdService().getOrCreate();

    await SupabaseConfig.client.functions.invoke(
      'process_zone_heartbeat',
      body: {
        'device_id': deviceId,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'accuracy_meters': position.accuracy,
        'observed_at': position.timestamp.toUtc().toIso8601String(),
        'source': source,
      },
    );
  }

  static Future<bool> runBackgroundHeartbeat() async {
    if (!Platform.isAndroid) return true;

    final settings = ZoneMonitoringSettingsService();
    if (!await settings.isEnabled()) return true;

    if (SupabaseConfig.client.auth.currentUser?.id == null) return true;

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return true;

    final permission = await Geolocator.checkPermission();
    if (permission != LocationPermission.always) return true;

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 20),
      );

      await sendHeartbeatForPosition(position, source: 'background');
      return true;
    } catch (error) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Zone monitoring background heartbeat failed: $error');
      }
      return false;
    }
  }
}
