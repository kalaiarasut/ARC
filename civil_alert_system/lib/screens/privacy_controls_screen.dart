import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/l10n.dart';
import '../providers/privacy_provider.dart';
import '../theme/app_colors.dart';

class PrivacyControlsScreen extends ConsumerWidget {
  const PrivacyControlsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final privacy = ref.watch(privacySettingsProvider);

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
          context.l10n.privacyTitle,
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: SwitchListTile(
              value: privacy.reduceMapPrecision,
              onChanged: (v) => ref.read(privacySettingsProvider.notifier).setReduceMapPrecision(v),
              title: Text(context.l10n.privacyReducePrecisionTitle),
              subtitle: Text(
                context.l10n.privacyReducePrecisionSubtitle,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              activeColor: AppColors.primaryBlue,
            ),
          ),
        ],
      ),
    );
  }
}
