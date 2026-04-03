import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/supabase_config.dart';
import 'android_workmanager_report_sync.dart';
import 'device_id_service.dart';
import 'fcm_push_service.dart';
import 'notification_service.dart';
import 'push_token_service.dart';
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
  static const String _diagStatusKey = 'zone_monitoring_diag_status';
  static const String _diagMessageKey = 'zone_monitoring_diag_message';
  static const String _diagUpdatedAtKey = 'zone_monitoring_diag_updated_at';

  bool get _isAndroid => Platform.isAndroid;

  static Future<void> _recordDiagnostic({
    required String status,
    String? message,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_diagStatusKey, status);
    await prefs.setString(_diagMessageKey, message ?? '');
    await prefs.setString(_diagUpdatedAtKey, DateTime.now().toIso8601String());
  }

  static Future<Map<String, String?>> getLatestDiagnostic() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'status': prefs.getString(_diagStatusKey),
      'message': prefs.getString(_diagMessageKey),
      'updated_at': prefs.getString(_diagUpdatedAtKey),
    };
  }

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

    if (!await Geolocator.isLocationServiceEnabled()) {
      await _settings.setEnabled(false);
      await PushTokenService().syncZoneMonitoringOptIn(false);
      await _restart();
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.locationServicesOff,
        enabled: false,
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      await _settings.setEnabled(false);
      await PushTokenService().syncZoneMonitoringOptIn(false);
      await _restart();
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.locationDenied,
        enabled: false,
      );
    }

    if (permission == LocationPermission.deniedForever) {
      await _settings.setEnabled(false);
      await PushTokenService().syncZoneMonitoringOptIn(false);
      await _restart();
      return const ZoneMonitoringStatus(
        mode: ZoneMonitoringMode.locationDenied,
        enabled: false,
      );
    }

    try {
      await Permission.locationAlways.request();
    } catch (_) {
      // Best effort only. Foreground-only mode is still valid.
    }

    await _settings.setEnabled(true);
    await PushTokenService().syncZoneMonitoringOptIn(true);
    await NotificationService.instance.initialize();
    await NotificationService.instance.requestPermissionIfNeeded();
    try {
      await FcmPushService.instance.enable();
    } catch (_) {
      // Keep monitoring enabled even if push bootstrap fails.
    }

    await _restart();
    return getStatus();
  }

  Future<void> disable() async {
    await _settings.setEnabled(false);
    await PushTokenService().syncZoneMonitoringOptIn(false);
    _lastForegroundHeartbeatAt = null;
    await _recordDiagnostic(
      status: 'disabled',
      message: 'Safety Zone Monitoring is off.',
    );
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

    if (_supabase.auth.currentSession?.user.id == null) {
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

    if (initialPosition == null) {
      try {
        initialPosition = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 15),
        );
      } catch (_) {
        initialPosition = null;
      }
    }

    if (initialPosition != null) {
      await _maybeSendForegroundHeartbeat(initialPosition, force: true);
    } else {
      await _recordDiagnostic(
        status: 'position_unavailable',
        message: 'Could not read current GPS position.',
      );
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
    final session = await _ensureValidHeartbeatSession();

    final userId = session?.user.id;
    if (userId == null) {
      await _recordDiagnostic(
        status: 'missing_session',
        message: 'No active Supabase session found for zone heartbeat.',
      );
      return;
    }

    final deviceId = await DeviceIdService().getOrCreate();
    final zoneMonitoringOptIn = await ZoneMonitoringSettingsService().isEnabled();

    try {
      await _recordDiagnostic(
        status: 'sending',
        message: 'Sending $source heartbeat...',
      );

      final response = await SupabaseConfig.client.functions.invoke(
        'process_zone_heartbeat',
        headers: {
          'x-supabase-auth': 'Bearer ${session!.accessToken}',
        },
        body: {
          'device_id': deviceId,
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy_meters': position.accuracy,
          'observed_at': position.timestamp.toUtc().toIso8601String(),
          'source': source,
          'zone_monitoring_opt_in': zoneMonitoringOptIn,
        },
      );

      await _recordDiagnostic(
        status: 'sent',
        message: 'Heartbeat sent successfully (${response.status}).',
      );
    } catch (error) {
      await _recordDiagnostic(
        status: 'failed',
        message: 'Heartbeat failed: $error',
      );
      rethrow;
    }
  }

  static Future<Session?> _ensureValidHeartbeatSession() async {
    final auth = SupabaseConfig.client.auth;
    Session? session = auth.currentSession;

    for (var attempt = 0; session == null && attempt < 10; attempt++) {
      await Future.delayed(const Duration(milliseconds: 250));
      session = auth.currentSession;
    }

    if (session == null) {
      await _recordDiagnostic(
        status: 'signed_out',
        message: 'Sign in before testing zone monitoring.',
      );
      return null;
    }

    final expiry = session.expiresAt;
    final isExpiringSoon = expiry != null
        ? DateTime.fromMillisecondsSinceEpoch(expiry * 1000).isBefore(
            DateTime.now().add(const Duration(minutes: 1)),
          )
        : false;

    if (isExpiringSoon) {
      try {
        final refreshed = await auth.refreshSession();
        session = refreshed.session ?? auth.currentSession ?? session;
      } catch (error) {
        await _recordDiagnostic(
          status: 'refresh_failed',
          message: 'Supabase session refresh failed. Continuing with current session. Error: $error',
        );
      }
    }

    return auth.currentSession ?? session;
  }

  Future<String?> sendTestHeartbeatNow() async {
    if (!_isAndroid) {
      await _recordDiagnostic(
        status: 'unsupported',
        message: 'Zone monitoring is Android-only.',
      );
      return 'Zone monitoring is Android-only.';
    }

    final session = await _ensureValidHeartbeatSession();
    if (session?.user.id == null) {
      await _recordDiagnostic(
        status: 'signed_out',
        message: 'Sign in before testing zone monitoring.',
      );
      return 'Sign in before testing zone monitoring.';
    }

    if (!await Geolocator.isLocationServiceEnabled()) {
      await _recordDiagnostic(
        status: 'location_services_off',
        message: 'Turn on GPS before testing zone monitoring.',
      );
      return 'Turn on GPS before testing zone monitoring.';
    }

    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      await _recordDiagnostic(
        status: 'location_denied',
        message: 'Location permission is required before testing zone monitoring.',
      );
      return 'Location permission is required before testing zone monitoring.';
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 20),
      );
      await sendHeartbeatForPosition(position, source: 'foreground');
      return null;
    } catch (error) {
      final message = 'Test heartbeat failed: $error';
      await _recordDiagnostic(status: 'failed', message: message);
      return message;
    }
  }

  static Future<bool> runBackgroundHeartbeat() async {
    if (!Platform.isAndroid) return true;

    final settings = ZoneMonitoringSettingsService();
    if (!await settings.isEnabled()) return true;

    if (SupabaseConfig.client.auth.currentSession?.user.id == null) return true;

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
