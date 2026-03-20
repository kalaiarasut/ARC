import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/official_advisory.dart';
import '../services/advisory_service.dart';
import '../theme/app_colors.dart';

class AdvisoryDetailsScreen extends StatelessWidget {
  final String advisoryId;

  const AdvisoryDetailsScreen({
    super.key,
    required this.advisoryId,
  });

  Future<void> _openDirections(BuildContext context, OfficialAdvisory advisory) async {
    final lat = advisory.latitude;
    final lon = advisory.longitude;
    if (lat == null || lon == null) return;

    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lon');
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open maps')),
      );
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
          'Advisory',
          style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextPrimary
                : AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: FutureBuilder<OfficialAdvisory?>(
        future: AdvisoryService().getById(advisoryId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue));
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Failed to load advisory: ${snapshot.error}',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkTextSecondary
                        : AppColors.textSecondary,
                  ),
                ),
              ),
            );
          }

          final advisory = snapshot.data;
          if (advisory == null) {
            return Center(
              child: Text(
                'Advisory not found.',
                style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkTextSecondary
                      : AppColors.textSecondary,
                ),
              ),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _pill(
                        text: advisory.severity.toUpperCase(),
                        color: advisory.severity.toLowerCase() == 'warning'
                            ? AppColors.error
                            : advisory.severity.toLowerCase() == 'watch'
                                ? AppColors.warning
                                : AppColors.primaryBlue,
                      ),
                      _pill(
                        text: advisory.category.toUpperCase(),
                        color: AppColors.primaryBlue,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    advisory.title,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  if ((advisory.region ?? '').trim().isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      advisory.region!,
                      style: TextStyle(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Text(
                    advisory.body,
                    style: TextStyle(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextSecondary
                          : AppColors.textSecondary,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Published: ${advisory.publishedAt.toLocal()}'.split('.').first,
                    style: TextStyle(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextSecondary
                          : AppColors.textSecondary,
                    ),
                  ),
                  if (advisory.startsAt != null || advisory.expiresAt != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      [
                        if (advisory.startsAt != null) 'Starts: ${advisory.startsAt!.toLocal()}'.split('.').first,
                        if (advisory.expiresAt != null) 'Expires: ${advisory.expiresAt!.toLocal()}'.split('.').first,
                      ].join(' | '),
                      style: TextStyle(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                  if ((advisory.contactPhone ?? '').isNotEmpty ||
                      (advisory.contactWhatsapp ?? '').isNotEmpty ||
                      (advisory.contactHotline ?? '').isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Emergency Contacts',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    if ((advisory.contactPhone ?? '').isNotEmpty) Text('Phone: ${advisory.contactPhone}'),
                    if ((advisory.contactWhatsapp ?? '').isNotEmpty) Text('WhatsApp: ${advisory.contactWhatsapp}'),
                    if ((advisory.contactHotline ?? '').isNotEmpty) Text('Hotline: ${advisory.contactHotline}'),
                  ],
                  if (advisory.latitude != null && advisory.longitude != null) ...[
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _openDirections(context, advisory),
                        icon: const Icon(Icons.directions, size: 18),
                        label: const Text('Get Directions'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryBlue,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _pill({required String text, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}
