import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

import '../core/supabase_config.dart';
import '../models/hazard_report.dart';
import 'offline_report_queue_service.dart';
import 'report_service.dart';
import 'upload_progress_controller.dart';

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

  int _mediaCount(dynamic mediaList) {
    if (mediaList is! List) return 0;
    var c = 0;
    for (final item in mediaList) {
      if (item is Map && item['path'] != null) c++;
    }
    return c;
  }

  Future<bool> _isOnline() async {
    final results = await Connectivity().checkConnectivity();
    return !results.contains(ConnectivityResult.none);
  }

  String _classifyError(Object e) {
    if (e is SocketException) return 'network';
    final msg = e.toString().toLowerCase();
    if (msg.contains('rate_limited')) return 'rate_limited';
    if (msg.contains('device_id_required')) return 'device_id_required';
    if (msg.contains('backend_submission_rpc_missing')) return 'backend_config';
    if (msg.contains('duplicate_report')) return 'duplicate';
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

      final userId = SupabaseConfig.client.auth.currentSession?.user.id ?? SupabaseConfig.client.auth.currentUser?.id;
      if (userId == null) {
        return const ReportSyncResult(attempted: 0, succeeded: 0, failed: 0);
      }

      final jobs = OfflineReportQueueService.getAllJobs();

      final eligibleJobs = jobs.where((job) {
        final clientId = job['clientId'] as String?;
        final reportJson = job['report'];
        final attempts = (job['attempts'] as num?)?.toInt() ?? 0;

        if (clientId == null || reportJson is! Map) return false;
        if (force) return true;
        if (attempts >= OfflineReportQueueService.maxAutoAttempts) return false;
        return OfflineReportQueueService.isDue(job);
      }).toList();

      var totalSteps = 0;
      for (final job in eligibleJobs) {
        totalSteps += 2; // report upload + finalize per job
        totalSteps += _mediaCount(job['media']); // keep real % for media bytes/files
      }

      if (eligibleJobs.isNotEmpty) {
        UploadProgressController.instance.start(
          flowType: UploadFlowType.sync,
          title: 'Syncing queued reports', // Background push service, can't easily access context here
          subtitle: 'Preparing ${eligibleJobs.length} pending report(s)',
          totalSteps: totalSteps,
        );
      }

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

          UploadProgressController.instance.note(
            'Syncing ${report.hazardType}',
            subtitle: 'Uploading report $attempted of ${eligibleJobs.length}',
          );

          // Safety: only sync own queued reports.
          if (report.userId != userId) {
            await OfflineReportQueueService.remove(clientId);
            UploadProgressController.instance.advance();
            continue;
          }

          final reportId = await _reportService.insertReport(report);
          UploadProgressController.instance.step('Report data uploaded');

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
            UploadProgressController.instance.advance(subtitle: 'Uploading attachments');
          }

          if (uploadedUrls.isNotEmpty) {
            await _reportService.updateReportMedia(reportId, uploadedUrls);
            UploadProgressController.instance.note('Attachments uploaded');
          }

          await OfflineReportQueueService.remove(clientId);
          UploadProgressController.instance.step('Report synced');
          succeeded++;
        } catch (e) {
          failed++;
          UploadProgressController.instance.note('Sync failed: ${e.toString()}');
          await OfflineReportQueueService.incrementAttempts(
            clientId,
            lastError: e.toString(),
            lastErrorCode: _classifyError(e),
          );
        }
      }

      if (eligibleJobs.isNotEmpty) {
        final message = failed == 0
            ? 'All queued reports synced'
            : 'Sync finished with $failed failed item(s)';
        if (failed == 0) {
          UploadProgressController.instance.complete(message);
        } else {
          UploadProgressController.instance.fail(message);
        }
      }

      return ReportSyncResult(attempted: attempted, succeeded: succeeded, failed: failed);
    } finally {
      _isSyncing = false;
    }
  }
}
