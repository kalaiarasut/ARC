import 'package:flutter/material.dart';

import '../services/upload_progress_controller.dart';
import '../theme/app_colors.dart';

class UploadProgressOverlay extends StatelessWidget {
  const UploadProgressOverlay({super.key});

  String _fmtTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    final s = dt.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<UploadProgressState?>(
      valueListenable: UploadProgressController.instance.state,
      builder: (context, progress, _) {
        if (progress == null) return const SizedBox.shrink();

        final color = progress.isFailed ? AppColors.error : AppColors.primaryBlue;

        return Material(
          color: Colors.black.withOpacity(0.35),
          child: SafeArea(
            child: Center(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 20),
                constraints: const BoxConstraints(maxWidth: 460),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        SizedBox(
                          width: 26,
                          height: 26,
                          child: progress.isCompleted
                              ? Icon(
                                  progress.isFailed ? Icons.error_outline : Icons.check_circle,
                                  color: color,
                                  size: 24,
                                )
                              : CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: color,
                                ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            progress.title,
                            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      progress.subtitle,
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: progress.progress,
                        minHeight: 8,
                        color: color,
                        backgroundColor: AppColors.greyOutline.withOpacity(0.35),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(progress.progress * 100).toStringAsFixed(0)}% · ${progress.completedSteps}/${progress.totalSteps}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxHeight: 170),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF7F9FB),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: ListView.separated(
                        shrinkWrap: true,
                        padding: const EdgeInsets.all(10),
                        itemCount: progress.timeline.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final event = progress.timeline[index];
                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                margin: const EdgeInsets.only(top: 5),
                                decoration: BoxDecoration(
                                  color: color,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  event.message,
                                  style: const TextStyle(fontSize: 12.5),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _fmtTime(event.at),
                                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                    if (progress.isCompleted && progress.completionMessage != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        progress.completionMessage!,
                        style: TextStyle(
                          color: progress.isFailed ? AppColors.error : AppColors.success,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: UploadProgressController.instance.clear,
                          child: const Text('Close'),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
