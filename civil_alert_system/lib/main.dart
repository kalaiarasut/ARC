import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/supabase_config.dart';
import 'services/report_sync_manager.dart';
import 'services/storage_service.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';

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

  // Start offline report sync (best-effort, no UI required)
  ReportSyncManager.instance.start();

  runApp(
    // Wrap with ProviderScope for Riverpod
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Civil Alert System',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}
