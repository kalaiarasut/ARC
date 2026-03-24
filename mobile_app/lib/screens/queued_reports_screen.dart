import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../services/offline_report_queue_service.dart';
import '../services/report_sync_service.dart';
import '../theme/app_colors.dart';
import '../l10n/l10n.dart';
import '../widgets/queued_reports_list.dart';

class QueuedReportsScreen extends StatefulWidget {
  const QueuedReportsScreen({super.key});

  @override
  State<QueuedReportsScreen> createState() => _QueuedReportsScreenState();
}

class _QueuedReportsScreenState extends State<QueuedReportsScreen> {
  final ReportSyncService _syncService = ReportSyncService();
  bool _isSyncing = false;

  Future<void> _syncNow() async {
    if (_isSyncing) return;

    setState(() => _isSyncing = true);
    try {
      final result = await _syncService.syncPendingReports(force: true);
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result.attempted == 0
                ? context.l10n.nothingToSync
                : context.l10n.syncDone(result.succeeded, result.failed),
          ),
          backgroundColor: result.failed == 0 ? AppColors.success : AppColors.warning,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSyncing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios,
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextPrimary
                : AppColors.textPrimary,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.offlineReports,
          style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextPrimary
                : AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          TextButton.icon(
            onPressed: _isSyncing ? null : _syncNow,
            icon: _isSyncing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.sync, size: 18),
            label: Text(context.l10n.syncNow),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ValueListenableBuilder(
              valueListenable: Hive.box(OfflineReportQueueService.boxName).listenable(),
              builder: (context, box, _) {
                final count = box.length;
                final stuckCount = box.values.where((value) {
                  final job = QueuedReportsList.asStringKeyedMap(value);
                  final attempts = (job['attempts'] as num?)?.toInt() ?? 0;
                  return attempts >= OfflineReportQueueService.maxAutoAttempts;
                }).length;

                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: AppColors.warning.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.inventory_2_outlined, color: AppColors.warning),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.l10n.queuedReportsCount(count),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              stuckCount > 0
                                  ? context.l10n.stuckItemsManualAttention(stuckCount)
                                  : context.l10n.reviewRetryStatus,
                              style: TextStyle(
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            Expanded(
              child: QueuedReportsList(
                onSyncRequested: _syncNow,
                isSyncing: _isSyncing,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
