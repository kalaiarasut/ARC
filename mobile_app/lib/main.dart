import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'l10n/app_localizations.dart';
import 'core/supabase_config.dart';
import 'core/app_navigator.dart';
import 'providers/language_provider.dart';
import 'services/android_workmanager_report_sync.dart';
import 'services/fcm_push_service.dart';
import 'services/notification_service.dart';
import 'services/notification_settings_service.dart';
import 'services/realtime_notification_service.dart';
import 'services/report_sync_manager.dart';
import 'services/storage_service.dart';
import 'services/tile_caching_service.dart';
import 'providers/theme_provider.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';
import 'widgets/upload_progress_overlay.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set system UI style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );

  // Initialize Hive for local storage
  await StorageService.initialize();

  // Initialize Supabase
  await SupabaseConfig.initialize();

  // Initialize offline map tile caching
  await TileCachingService.initialize();

  // Android-only periodic background sync (WorkManager)
  if (Platform.isAndroid) {
    await AndroidWorkmanagerReportSync.initialize(debug: false);

    final notificationsEnabled = await NotificationSettingsService().isEnabled();

    if (notificationsEnabled) {
      await NotificationService.instance.initialize();
      // Best-effort: request permission on startup (Android 13+).
      // ignore: discarded_futures
      NotificationService.instance.requestPermissionIfNeeded();
    }

    // Prefer true push (FCM). If Firebase isn't configured yet, fall back to Realtime.
    var fcmStarted = false;
    if (notificationsEnabled) {
      try {
        fcmStarted = await FcmPushService.instance.startIfEnabled();
      } catch (_) {
        fcmStarted = false;
      }
    }
    if (notificationsEnabled && !fcmStarted) {
      // Realtime listeners will generate local notifications while app process is alive.
      // ignore: discarded_futures
      RealtimeNotificationService.instance.start();
    }
  }

  // Start offline report sync (best-effort, no UI required)
  ReportSyncManager.instance.start();

  runApp(
    // Wrap with ProviderScope for Riverpod
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final themeMode = ref.watch(themeModeProvider);
    return MaterialApp(
      title: 'ARC',
      debugShowCheckedModeBanner: false,
      navigatorKey: appNavigatorKey,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) {
        return Stack(
          children: [
            if (child != null) child,
            const UploadProgressOverlay(),
          ],
        );
      },
      home: const SplashScreen(),
    );
  }
}
