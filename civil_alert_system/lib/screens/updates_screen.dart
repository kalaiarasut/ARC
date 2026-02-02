import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../models/official_advisory.dart';
import '../services/advisory_service.dart';
import '../services/offline_report_queue_service.dart';
import '../theme/app_colors.dart';
import '../l10n/l10n.dart';
import '../widgets/app_state_view.dart';

final advisoryServiceProvider = Provider<AdvisoryService>((ref) => AdvisoryService());
final advisoriesProvider = FutureProvider<List<OfficialAdvisory>>((ref) async {
  return ref.read(advisoryServiceProvider).getLatest();
});

class UpdatesScreen extends ConsumerWidget {
  const UpdatesScreen({super.key});

  Color _severityColor(String severity) {
    switch (severity) {
      case 'warning':
        return AppColors.error;
      case 'watch':
        return AppColors.warning;
      default:
        return AppColors.primaryBlue;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final advisories = ref.watch(advisoriesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FB),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.updates,
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        actions: [
          ValueListenableBuilder(
            valueListenable: Hive.box(OfflineReportQueueService.boxName).listenable(),
            builder: (context, box, _) {
              final count = box.length;
              if (count == 0) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.warning.withOpacity(0.35)),
                    ),
                    child: Text(
                      context.l10n.pendingCount(count),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              );
            },
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: advisories.when(
          data: (items) {
            if (items.isEmpty) {
              return Center(
                child: Text(context.l10n.noUpdatesYet, style: const TextStyle(color: AppColors.textSecondary)),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(advisoriesProvider);
                await ref.read(advisoriesProvider.future);
              },
              child: ListView.separated(
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final a = items[index];
                  final sevColor = _severityColor(a.severity);

                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: sevColor.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                a.severity.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: sevColor,
                                ),
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '${a.publishedAt.toLocal()}'.split('.').first,
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          a.title,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        if (a.region != null && a.region!.trim().isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            a.region!,
                            style: const TextStyle(color: AppColors.textSecondary),
                          ),
                        ],
                        const SizedBox(height: 10),
                        Text(
                          a.body,
                          style: const TextStyle(color: AppColors.textSecondary, height: 1.3),
                        ),
                      ],
                    ),
                  );
                },
              ),
            );
          },
          error: (e, _) => Center(
            child: AppStateView(
              icon: Icons.wifi_off,
              title: context.l10n.failedToLoadUpdates,
              message: e.toString().toLowerCase().contains('socket') || e.toString().toLowerCase().contains('failed host')
                  ? context.l10n.youreOffline
                  : e.toString(),
              actionLabel: context.l10n.retry,
              onAction: () async {
                ref.invalidate(advisoriesProvider);
                await ref.read(advisoriesProvider.future);
              },
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue)),
        ),
      ),
    );
  }
}
