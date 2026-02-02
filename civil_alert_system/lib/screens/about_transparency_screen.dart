import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../theme/app_colors.dart';

class AboutTransparencyScreen extends StatelessWidget {
  const AboutTransparencyScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
          context.l10n.aboutTitle,
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _section(
            title: context.l10n.aboutTransparency,
            body:
                'This app helps citizens report ocean hazards and helps authorities understand real-time conditions.\n\n'
                'We prioritize privacy by limiting public exposure of personal details and by using privacy-safe map data for public views.',
          ),
          const SizedBox(height: 12),
          _section(
            title: context.l10n.privacy,
            body:
                'What we collect: your phone (for login), your report description, time, and location.\n\n'
                'How we use it: to store your report and show verified, privacy-safe information on the map and updates feed.',
          ),
        ],
      ),
    );
  }

  Widget _section({required String title, required String body}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(color: AppColors.textSecondary, height: 1.35)),
        ],
      ),
    );
  }
}
