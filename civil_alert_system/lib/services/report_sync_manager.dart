import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

import 'report_sync_service.dart';

/// Lightweight background manager that triggers sync when connectivity returns.
class ReportSyncManager {
  static final ReportSyncManager instance = ReportSyncManager._();

  ReportSyncManager._();

  final ReportSyncService _syncService = ReportSyncService();
  StreamSubscription<dynamic>? _sub;

  bool _started = false;

  void start() {
    if (_started) return;
    _started = true;

    // Attempt a sync on startup.
    unawaited(_syncService.syncPendingReports(force: false).then((_) {}));

    final Stream<dynamic> connectivityStream = Connectivity().onConnectivityChanged as Stream<dynamic>;
    _sub = connectivityStream.listen((result) {
      // connectivity_plus has changed stream payload across versions.
      // Support both: ConnectivityResult and List<ConnectivityResult>.
      final bool isOffline = switch (result) {
        ConnectivityResult r => r == ConnectivityResult.none,
        List<ConnectivityResult> rs => rs.contains(ConnectivityResult.none),
        _ => true,
      };

      if (isOffline) return;
      unawaited(_syncService.syncPendingReports(force: false).then((_) {}));
    });
  }

  void dispose() {
    _sub?.cancel();
    _sub = null;
    _started = false;
  }
}
