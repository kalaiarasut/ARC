import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

import 'report_sync_service.dart';

/// Lightweight background manager that triggers sync when connectivity returns.
class ReportSyncManager {
  static final ReportSyncManager instance = ReportSyncManager._();

  ReportSyncManager._();

  final ReportSyncService _syncService = ReportSyncService();
  StreamSubscription<List<ConnectivityResult>>? _sub;

  bool _started = false;

  void start() {
    if (_started) return;
    _started = true;

    // Attempt a sync on startup.
    unawaited(_syncService.syncPendingReports().then((_) {}));

    _sub = Connectivity().onConnectivityChanged.listen((result) {
      if (result.contains(ConnectivityResult.none)) return;
      unawaited(_syncService.syncPendingReports().then((_) {}));
    });
  }

  void dispose() {
    _sub?.cancel();
    _sub = null;
    _started = false;
  }
}
