import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../l10n/l10n.dart';
import '../providers/auth_provider.dart';
import '../services/fcm_push_service.dart';
import '../services/notification_settings_service.dart';
import '../services/notification_service.dart';
import '../services/realtime_notification_service.dart';
import '../theme/app_colors.dart';
import 'about_transparency_screen.dart';
import 'help_faq_screen.dart';
import 'language_screen.dart';
import 'login_screen.dart';
import 'profile_module_screen.dart';
import 'privacy_controls_screen.dart';
import 'achievements_screen.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final NotificationSettingsService _notificationSettings = NotificationSettingsService();
  bool? _notificationsEnabled;

  @override
  void initState() {
    super.initState();
    _loadNotificationsSetting();
  }

  Future<void> _loadNotificationsSetting() async {
    final enabled = await _notificationSettings.isEnabled();
    if (!mounted) return;
    setState(() => _notificationsEnabled = enabled);
  }

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
          context.l10n.settings,
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _card(
            child: Column(
              children: [
                SwitchListTile(
                  value: _notificationsEnabled ?? true,
                  secondary: const Icon(Icons.notifications_outlined, color: AppColors.primaryBlue),
                  title: const Text('Notifications'),
                  subtitle: const Text('Advisories and report status updates'),
                  onChanged: _notificationsEnabled == null
                      ? null
                      : (v) async {
                          setState(() => _notificationsEnabled = v);
                          await _notificationSettings.setEnabled(v);

                          if (v) {
                            await NotificationService.instance.initialize();
                            await NotificationService.instance.requestPermissionIfNeeded();

                            var fcmStarted = false;
                            try {
                              await FcmPushService.instance.enable();
                              fcmStarted = true;
                            } catch (_) {
                              fcmStarted = false;
                            }

                            if (!fcmStarted) {
                              await RealtimeNotificationService.instance.start();
                            } else {
                              await RealtimeNotificationService.instance.stop();
                            }
                          } else {
                            // Best-effort: disable true push and stop realtime.
                            // ignore: discarded_futures
                            FcmPushService.instance.disable();
                            await RealtimeNotificationService.instance.stop();
                          }
                        },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.person_outline, color: AppColors.primaryBlue),
                  title: Text(context.l10n.profile),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProfileModuleScreen()),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.emoji_events_outlined, color: AppColors.primaryBlue),
                  title: const Text('Achievements & Badges'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AchievementsScreen()),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.help_outline, color: AppColors.primaryBlue),
                  title: Text(context.l10n.helpFaq),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const HelpFaqScreen()),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.info_outline, color: AppColors.primaryBlue),
                  title: Text(context.l10n.aboutTransparency),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AboutTransparencyScreen()),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.language, color: AppColors.primaryBlue),
                  title: Text(context.l10n.language),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LanguageScreen(fromSettings: true)),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.privacy_tip_outlined, color: AppColors.primaryBlue),
                  title: Text(context.l10n.privacyControls),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const PrivacyControlsScreen()),
                    );
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          _card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.logout, color: AppColors.error),
                  title: const Text('Log out', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700)),
                  onTap: () async {
                    final ok = await showDialog<bool>(
                      context: context,
                      builder: (context) {
                        return AlertDialog(
                          title: const Text('Log out?'),
                          content: const Text('You will need to verify your phone again to sign back in.'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: Text(context.l10n.cancel),
                            ),
                            ElevatedButton(
                              onPressed: () => Navigator.pop(context, true),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.error,
                                foregroundColor: Colors.white,
                                elevation: 0,
                              ),
                              child: const Text('Log out'),
                            ),
                          ],
                        );
                      },
                    );

                    if (ok != true) return;

                    // Sign out of Supabase
                    await ref.read(authStateProvider.notifier).signOut();

                    // Optional: keep onboarding complete but ensure Splash routes to login if signed out.
                    // We still clear any cached phone number in preferences to avoid confusion in UI.
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.remove('user_phone');

                    if (!context.mounted) return;
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (_) => false,
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _card({required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }
}
