import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import 'notification_service.dart';
import 'notification_settings_service.dart';
import 'push_token_service.dart';

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

  // Best-effort local notification.
  await NotificationService.instance.show(
    id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
    title: title,
    body: body,
  );
}

class FcmPushService {
  static final FcmPushService instance = FcmPushService._();
  FcmPushService._();

  final NotificationSettingsService _settings = NotificationSettingsService();
  final PushTokenService _pushTokens = PushTokenService();

  bool _listenersAttached = false;

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

    // Foreground: show a local notification (we send data-only pushes from backend).
    FirebaseMessaging.onMessage.listen((message) async {
      final enabled = await _settings.isEnabled();
      if (!enabled) return;

      final title = message.notification?.title ?? message.data['title']?.toString();
      final body = message.notification?.body ?? message.data['body']?.toString();
      if (title == null || body == null) return;

      await NotificationService.instance.show(
        id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title: title,
        body: body,
      );
    });

    // Token refresh: update Supabase.
    FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
      final enabled = await _settings.isEnabled();
      await _pushTokens.upsertToken(token: token, enabled: enabled);
    });

    // Future: handle taps to deep-link.
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('FCM opened: ${message.data}');
      }
    });

    _listenersAttached = true;
  }
}
