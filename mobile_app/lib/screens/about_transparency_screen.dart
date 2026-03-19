import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../theme/app_colors.dart';

class AboutTransparencyScreen extends StatelessWidget {
  const AboutTransparencyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.aboutTitle,
          style: TextStyle(color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _section(
            context: context,
            title: context.l10n.aboutTransparency,
            body:
                'This app helps citizens report ocean hazards and helps authorities understand real-time conditions.\n\n'
                'We prioritize privacy by limiting public exposure of personal details and by using privacy-safe map data for public views.',
          ),
          const SizedBox(height: 12),
          _section(
            context: context,
            title: context.l10n.privacy,
            body:
                'What we collect: your phone (for login), your report description, time, and location.\n\n'
                'How we use it: to store your report and show verified, privacy-safe information on the map and updates feed.',
          ),
        ],
      ),
    );
  }

  Widget _section({required BuildContext context, required String title, required String body}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary)),
          const SizedBox(height: 8),
          Text(body, style: TextStyle(color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary, height: 1.35)),
        ],
      ),
    );
  }
}
