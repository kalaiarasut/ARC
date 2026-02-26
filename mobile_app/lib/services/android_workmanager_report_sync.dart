import 'package:flutter/widgets.dart';
import 'package:workmanager/workmanager.dart';

import '../core/supabase_config.dart';
import 'report_sync_service.dart';
import 'storage_service.dart';

class AndroidWorkmanagerReportSync {
  static const String taskName = 'casReportSync';
  static const String uniquePeriodicName = 'cas-report-sync-periodic';

  static Future<void> initialize({bool debug = false}) async {
    await Workmanager().initialize(callbackDispatcher, isInDebugMode: debug);

    // Android minimum for periodic work is ~15 minutes.
    await Workmanager().registerPeriodicTask(
      uniquePeriodicName,
      taskName,
      frequency: const Duration(minutes: 15),
      initialDelay: const Duration(minutes: 5),
      constraints: Constraints(networkType: NetworkType.connected),
      backoffPolicy: BackoffPolicy.exponential,
      backoffPolicyDelay: const Duration(minutes: 10),
      existingWorkPolicy: ExistingPeriodicWorkPolicy.keep,
    );
  }

  static Future<void> cancel() async {
    await Workmanager().cancelByUniqueName(uniquePeriodicName);
  }
}

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      WidgetsFlutterBinding.ensureInitialized();

      // Needed for Hive box access in background isolate.
      await StorageService.initialize();

      // Needed for auth/session + Supabase calls.
      await SupabaseConfig.initialize();

      // If the user is signed out, don't keep retrying.
      final userId = SupabaseConfig.client.auth.currentUser?.id;
      if (userId == null) return true;

      await ReportSyncService().syncPendingReports(force: false);
      return true;
    } catch (_) {
      // Returning false tells WorkManager to retry with its own backoff.
      return false;
    }
  });
}
