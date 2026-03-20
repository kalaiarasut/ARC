import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../services/offline_report_queue_service.dart';
import '../theme/app_colors.dart';
import '../l10n/l10n.dart';

typedef QueuedReportsSyncCallback = Future<void> Function();

class QueuedReportsList extends StatelessWidget {
  final QueuedReportsSyncCallback onSyncRequested;
  final bool isSyncing;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final EdgeInsetsGeometry padding;

  const QueuedReportsList({
    super.key,
    required this.onSyncRequested,
    this.isSyncing = false,
    this.shrinkWrap = false,
    this.physics,
    this.padding = EdgeInsets.zero,
  });

  static Map<String, dynamic> asStringKeyedMap(dynamic value) {
    if (value is Map) {
      return value.map((k, v) => MapEntry(k.toString(), v));
    }
    return <String, dynamic>{};
  }

  static DateTime? parseDateTime(dynamic value) {
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  static String friendlyReason(String? code) {
    switch (code) {
      case 'network':
        return 'Network error';
      case 'timeout':
        return 'Request timed out';
      case 'auth':
        return 'Login required';
      case 'permission':
        return 'Permission denied';
      case 'file_missing':
        return 'Missing media file';
      case 'rate_limited':
        return 'Too many reports (rate limited)';
      case 'duplicate':
        return 'Duplicate report detected';
      case 'unknown':
      default:
        return 'Upload failed';
    }
  }

  static ({String label, Color color}) queueStatusFor(Map<String, dynamic> job) {
    final attempts = (job['attempts'] as num?)?.toInt() ?? 0;
    if (attempts >= OfflineReportQueueService.maxAutoAttempts) {
      return (label: 'Stuck', color: AppColors.error);
    }
    if (attempts == 0) {
      return (label: 'Pending upload', color: AppColors.primaryBlue);
    }
    if (OfflineReportQueueService.isDue(job)) {
      return (label: 'Ready to retry', color: AppColors.success);
    }
    return (label: 'Waiting for retry', color: AppColors.warning);
  }

  Future<void> _removeJob(BuildContext context, String clientId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove queued report?'),
        content: const Text('This will delete the offline copy and stop future retries for this report.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    await OfflineReportQueueService.remove(clientId);

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Queued report removed')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: Hive.box(OfflineReportQueueService.boxName).listenable(),
      builder: (context, box, _) {
        if (box.isEmpty) {
          return Center(
            child: Text(
              context.l10n.noPendingReports,
              style: TextStyle(
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppColors.darkTextSecondary
                    : AppColors.textSecondary,
              ),
            ),
          );
        }

        final jobs = <Map<String, dynamic>>[];
        for (final key in box.keys) {
          final raw = box.get(key);
          if (raw is! Map) continue;
          final job = asStringKeyedMap(raw);
          final createdAt = parseDateTime(job['createdAt']) ?? DateTime.fromMillisecondsSinceEpoch(0);
          jobs.add({
            ...job,
            '_clientId': key.toString(),
            '_createdAt': createdAt,
          });
        }

        jobs.sort((a, b) {
          final aStuck = ((a['attempts'] as num?)?.toInt() ?? 0) >= OfflineReportQueueService.maxAutoAttempts;
          final bStuck = ((b['attempts'] as num?)?.toInt() ?? 0) >= OfflineReportQueueService.maxAutoAttempts;
          if (aStuck != bStuck) return aStuck ? -1 : 1;

          final aDue = OfflineReportQueueService.isDue(a);
          final bDue = OfflineReportQueueService.isDue(b);
          if (aDue != bDue) return aDue ? -1 : 1;

          final aCreated = a['_createdAt'] as DateTime;
          final bCreated = b['_createdAt'] as DateTime;
          return bCreated.compareTo(aCreated);
        });

        return ListView.separated(
          shrinkWrap: shrinkWrap,
          physics: physics,
          padding: padding,
          itemCount: jobs.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final job = jobs[index];
            final report = asStringKeyedMap(job['report']);
            final clientId = job['_clientId']?.toString() ?? '';
            final hazardType = report['hazardType']?.toString() ?? 'Unknown';
            final description = report['description']?.toString() ?? '';
            final attempts = (job['attempts'] as num?)?.toInt() ?? 0;
            final lastError = job['lastError']?.toString();
            final lastErrorCode = job['lastErrorCode']?.toString();
            final mediaItems = job['media'] is List ? job['media'] as List : const [];
            final createdAt = job['_createdAt'] as DateTime;
            final nextAttemptAt = parseDateTime(job['nextAttemptAt']);
            final queueStatus = queueStatusFor(job);

            return Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: queueStatus.color.withOpacity(0.18)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              hazardType,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              description,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: queueStatus.color.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          queueStatus.label,
                          style: TextStyle(
                            color: queueStatus.color,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _metaPill(
                        context,
                        Icons.sync_problem_outlined,
                        context.l10n.attemptsLabel(attempts),
                      ),
                      _metaPill(
                        context,
                        Icons.attach_file,
                        '${mediaItems.length} attachment${mediaItems.length == 1 ? '' : 's'}',
                      ),
                      _metaPill(
                        context,
                        Icons.schedule_outlined,
                        'Created ${createdAt.toLocal()}'.split('.').first,
                      ),
                    ],
                  ),
                  if (nextAttemptAt != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Next retry: ${nextAttemptAt.toLocal()}'.split('.').first,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                  if (lastError != null && lastError.trim().isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      friendlyReason(lastErrorCode),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.error,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      lastError,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.error,
                        fontSize: 12,
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      TextButton.icon(
                        onPressed: isSyncing ? null : onSyncRequested,
                        icon: isSyncing
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.sync, size: 18),
                        label: Text(context.l10n.retry),
                      ),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: clientId.isEmpty ? null : () => _removeJob(context, clientId),
                        icon: const Icon(Icons.delete_outline, size: 18),
                        label: Text(context.l10n.remove),
                        style: TextButton.styleFrom(foregroundColor: AppColors.error),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _metaPill(BuildContext context, IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? Colors.white.withOpacity(0.06)
            : Colors.black.withOpacity(0.04),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextSecondary
                : AppColors.textSecondary,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkTextSecondary
                  : AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
