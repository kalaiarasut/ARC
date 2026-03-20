import 'dart:convert';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../core/app_navigator.dart';
import '../screens/advisory_details_screen.dart';
import '../screens/report_details_screen.dart';
import 'notification_service.dart';
import 'notification_settings_service.dart';
import 'push_token_service.dart';

Future<bool> _shouldShowNotification(RemoteMessage message) async {
  final radiusStr = message.data['radius_km']?.toString();
  final latStr = message.data['latitude']?.toString();
  final lngStr = message.data['longitude']?.toString();

  if (radiusStr == null || latStr == null || lngStr == null) return true;
  
  final radiusKm = double.tryParse(radiusStr);
  final lat = double.tryParse(latStr);
  final lng = double.tryParse(lngStr);

  if (radiusKm == null || lat == null || lng == null) return true;

  try {
    final perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
      return false; // Hide targeted advisory if we don't know location
    }

    final pos = await Geolocator.getLastKnownPosition();
    if (pos == null) return false;

    const distance = Distance();
    final d = distance.as(LengthUnit.Meter, LatLng(pos.latitude, pos.longitude), LatLng(lat, lng));
    
    return d <= (radiusKm * 1000);
  } catch (_) {
    return true; 
  }
}

String _encodeNotificationPayload(Map<String, dynamic> data) {
  final normalized = <String, dynamic>{};
  for (final entry in data.entries) {
    normalized[entry.key] = entry.value?.toString();
  }
  return jsonEncode(normalized);
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (!Platform.isAndroid) return;

  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Ignore (typically means Firebase wasn't configured for this build).
  }

  final title = message.notification?.title ?? message.data['title']?.toString();
  final body = message.notification?.body ?? message.data['body']?.toString();

  if (title == null || body == null) return;

  if (!await _shouldShowNotification(message)) return;

  // Best-effort local notification.
  await NotificationService.instance.show(
    id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
    title: title,
    body: body,
    payload: _encodeNotificationPayload(message.data),
  );
}

class FcmPushService {
  static final FcmPushService instance = FcmPushService._();
  FcmPushService._();

  final NotificationSettingsService _settings = NotificationSettingsService();
  final PushTokenService _pushTokens = PushTokenService();

  bool _listenersAttached = false;
  bool _initialTapChecksDone = false;

  Future<bool> startIfEnabled() async {
    if (!Platform.isAndroid) return false;

    final enabled = await _settings.isEnabled();

    // Firebase init must happen before we set up listeners.
    await Firebase.initializeApp();

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    if (!enabled) return false;

    await _ensureListeners();

    // On Android 13+, this will prompt if needed.
    // We also request via local notifications plugin elsewhere, but this is safe.
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    final token = await FirebaseMessaging.instance.getToken();
    if (token != null && token.trim().isNotEmpty) {
      await _pushTokens.upsertToken(token: token, enabled: true);
    }

    return true;
  }

  Future<void> enable() async {
    if (!Platform.isAndroid) return;

    await _settings.setEnabled(true);

    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    await _ensureListeners();

    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    final token = await FirebaseMessaging.instance.getToken();
    if (token != null && token.trim().isNotEmpty) {
      await _pushTokens.upsertToken(token: token, enabled: true);
    }
  }

  Future<void> disable() async {
    if (!Platform.isAndroid) return;

    await _settings.setEnabled(false);

    // Best-effort: stop sending to this device server-side.
    await _pushTokens.setEnabled(false);

    // Best-effort: invalidate token on device.
    try {
      await FirebaseMessaging.instance.deleteToken();
    } catch (_) {
      // ignore
    }
  }

  Future<void> _ensureListeners() async {
    if (_listenersAttached) return;

    NotificationService.instance.setTapHandler((payload) async {
      await _handleNotificationPayload(payload);
    });

    if (!_initialTapChecksDone) {
      _initialTapChecksDone = true;

      final launchPayload = await NotificationService.instance.consumeLaunchPayload();
      await _handleNotificationPayload(launchPayload);

      final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        await _handleTapData(initialMessage.data);
      }
    }

    // Foreground: show a local notification (we send data-only pushes from backend).
    FirebaseMessaging.onMessage.listen((message) async {
      final enabled = await _settings.isEnabled();
      if (!enabled) return;

      final title = message.notification?.title ?? message.data['title']?.toString();
      final body = message.notification?.body ?? message.data['body']?.toString();
      if (title == null || body == null) return;

      if (!await _shouldShowNotification(message)) return;

      await NotificationService.instance.show(
        id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title: title,
        body: body,
        payload: _encodeNotificationPayload(message.data),
      );
    });

    // Token refresh: update Supabase.
    FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
      final enabled = await _settings.isEnabled();
      await _pushTokens.upsertToken(token: token, enabled: enabled);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((message) async {
      await _handleTapData(message.data);
      if (kDebugMode) {
        // ignore: avoid_print
        print('FCM opened: ${message.data}');
      }
    });

    _listenersAttached = true;
  }

  Future<void> _handleNotificationPayload(String? payload) async {
    if (payload == null || payload.trim().isEmpty) return;
    try {
      final decoded = jsonDecode(payload);
      if (decoded is Map<String, dynamic>) {
        await _handleTapData(decoded);
        return;
      }
      if (decoded is Map) {
        await _handleTapData(
          decoded.map((key, value) => MapEntry(key.toString(), value)),
        );
      }
    } catch (_) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Invalid notification payload: $payload');
      }
    }
  }

  Future<void> _handleTapData(Map<String, dynamic> data) async {
    final reportId = _asNonEmptyString(data['report_id']);
    if (reportId != null) {
      await pushRouteWhenReady(
        MaterialPageRoute(
          builder: (_) => ReportDetailsScreen(reportId: reportId, isOwnReport: true),
        ),
      );
      return;
    }

    final advisoryId = _asNonEmptyString(data['advisory_id']);
    if (advisoryId != null) {
      await pushRouteWhenReady(
        MaterialPageRoute(
          builder: (_) => AdvisoryDetailsScreen(advisoryId: advisoryId),
        ),
      );
    }
  }

  String? _asNonEmptyString(Object? value) {
    final parsed = value?.toString().trim();
    if (parsed == null || parsed.isEmpty || parsed == 'null') return null;
    return parsed;
  }
}
