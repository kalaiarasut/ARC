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
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.privacyTitle,
          style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
            child: SwitchListTile(
              value: privacy.reduceMapPrecision,
              onChanged: (v) => ref.read(privacySettingsProvider.notifier).setReduceMapPrecision(v),
              title: Text(context.l10n.privacyReducePrecisionTitle),
              subtitle: Text(
                context.l10n.privacyReducePrecisionSubtitle,
                style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
              ),
              activeColor: AppColors.primaryBlue,
            ),
          ),
        ],
      ),
    );
  }
}
