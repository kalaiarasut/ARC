import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

import '../core/supabase_config.dart';
import '../models/hazard_report.dart';
import 'offline_report_queue_service.dart';
import 'report_service.dart';

class ReportSyncResult {
  final int attempted;
  final int succeeded;
  final int failed;

  const ReportSyncResult({
    required this.attempted,
    required this.succeeded,
    required this.failed,
  });
}

/// Syncs queued reports when connectivity is available.
class ReportSyncService {
  final ReportService _reportService;

  bool _isSyncing = false;

  ReportSyncService({ReportService? reportService})
      : _reportService = reportService ?? ReportService();

  bool get isSyncing => _isSyncing;

  Future<bool> _isOnline() async {
    final results = await Connectivity().checkConnectivity();
    return !results.contains(ConnectivityResult.none);
  }

  String _classifyError(Object e) {
    if (e is SocketException) return 'network';
    final msg = e.toString().toLowerCase();
    if (msg.contains('jwt') || msg.contains('auth') || msg.contains('unauthorized') || msg.contains('not authenticated')) {
      return 'auth';
    }
    if (msg.contains('rls') || msg.contains('permission denied') || msg.contains('not allowed')) {
      return 'permission';
    }
    if (msg.contains('no such file') || msg.contains('file not found') || msg.contains('pathnotfound')) {
      return 'file_missing';
    }
    if (msg.contains('timeout')) return 'timeout';
    return 'unknown';
  }

  Future<ReportSyncResult> syncPendingReports({required bool force}) async {
    if (_isSyncing) {
      return const ReportSyncResult(attempted: 0, succeeded: 0, failed: 0);
    }

    _isSyncing = true;
    try {
      if (!await _isOnline()) {
        return const ReportSyncResult(attempted: 0, succeeded: 0, failed: 0);
      }

      final userId = SupabaseConfig.client.auth.currentUser?.id;
      if (userId == null) {
        return const ReportSyncResult(attempted: 0, succeeded: 0, failed: 0);
      }

      final jobs = OfflineReportQueueService.getAllJobs();

      var attempted = 0;
      var succeeded = 0;
      var failed = 0;

      for (final job in jobs) {
        final clientId = job['clientId'] as String?;
        final reportJson = job['report'];
        final mediaList = job['media'];
        final attempts = (job['attempts'] as num?)?.toInt() ?? 0;

        if (clientId == null || reportJson is! Map) continue;

        if (!force) {
          if (attempts >= OfflineReportQueueService.maxAutoAttempts) {
            continue;
          }
          if (!OfflineReportQueueService.isDue(job)) {
            continue;
          }
        }

        attempted++;
        try {
          final report = HazardReport.fromQueueJson(
            Map<String, dynamic>.from(reportJson),
          );

          // Safety: only sync own queued reports.
          if (report.userId != userId) {
            await OfflineReportQueueService.remove(clientId);
            continue;
          }

          final reportId = await _reportService.insertReport(report);

          final mediaItems = <Map<String, dynamic>>[];
          if (mediaList is List) {
            for (final item in mediaList) {
              if (item is Map) {
                mediaItems.add(Map<String, dynamic>.from(item));
              }
            }
          }

          final uploadedUrls = <String>[];
          for (var index = 0; index < mediaItems.length; index++) {
            final item = mediaItems[index];
            final path = item['path'] as String?;
            if (path == null) continue;

            final xfile = XFile(
              path,
              name: (item['name'] as String?) ?? 'media_$index',
              mimeType: item['mimeType'] as String?,
            );

            final url = await _reportService.uploadMedia(
              xfile,
              reportId,
              report.userId,
              index: index,
            );
            uploadedUrls.add(url);
          }

          if (uploadedUrls.isNotEmpty) {
            await _reportService.updateReportMedia(reportId, uploadedUrls);
          }

          await OfflineReportQueueService.remove(clientId);
          succeeded++;
        } catch (e) {
          failed++;
          await OfflineReportQueueService.incrementAttempts(
            clientId,
            lastError: e.toString(),
            lastErrorCode: _classifyError(e),
          );
        }
      }

      return ReportSyncResult(attempted: attempted, succeeded: succeeded, failed: failed);
    } finally {
      _isSyncing = false;
    }
  }
}
