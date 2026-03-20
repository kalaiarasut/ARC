import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

typedef NotificationTapHandler = Future<void> Function(String? payload);

@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse response) {
  // Handled on app launch via launch details.
}

class NotificationService {
  static final NotificationService instance = NotificationService._();
  NotificationService._();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  static const String _channelId = 'civil_alerts';
  static const String _channelName = 'Civil Alerts';
  NotificationTapHandler? _tapHandler;
  bool _launchDetailsConsumed = false;

  void setTapHandler(NotificationTapHandler handler) {
    _tapHandler = handler;
  }

  Future<void> initialize() async {
    if (_initialized) return;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);

    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (response) {
        final handler = _tapHandler;
        if (handler != null) {
          // ignore: discarded_futures
          handler(response.payload);
        }
      },
      onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
    );

    // Ensure channel exists
    const channel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: 'Advisories and report status updates',
      importance: Importance.high,
    );

    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await android?.createNotificationChannel(channel);

    _initialized = true;
  }

  Future<String?> consumeLaunchPayload() async {
    if (_launchDetailsConsumed) return null;
    if (!_initialized) {
      await initialize();
    }

    _launchDetailsConsumed = true;
    final details = await _plugin.getNotificationAppLaunchDetails();
    if (details?.didNotificationLaunchApp ?? false) {
      return details?.notificationResponse?.payload;
    }
    return null;
  }

  Future<bool> requestPermissionIfNeeded() async {
    // For Android 13+, this triggers the runtime permission dialog.
    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    final granted = await android?.requestNotificationsPermission();
    // If null (older Android), treat as granted.
    return granted ?? true;
  }

  Future<void> show({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    if (!_initialized) {
      await initialize();
    }

    const androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      importance: Importance.high,
      priority: Priority.high,
    );

    const details = NotificationDetails(android: androidDetails);

    try {
      await _plugin.show(id, title, body, details, payload: payload);
    } catch (e) {
      // Don't crash app if notifications fail.
      if (kDebugMode) {
        // ignore: avoid_print
        print('Notification show failed: $e');
      }
    }
  }
}
