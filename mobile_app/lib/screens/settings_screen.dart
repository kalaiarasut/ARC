import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../l10n/l10n.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
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
import 'offline_maps_screen.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final NotificationSettingsService _notificationSettings =
      NotificationSettingsService();
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final accent =
        isDark ? AppColors.darkSecondaryCyan : AppColors.primaryBlue;
    final textColor =
        isDark ? AppColors.darkTextPrimary : AppColors.textPrimary;
    final currentMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: textColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.settings,
          style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // ── Appearance ──
          Container(
            padding:
                const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(16),
              border: isDark
                  ? Border.all(
                      color: AppColors.darkOutline.withOpacity(0.5),
                      width: 0.5)
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.palette_outlined, color: accent, size: 22),
                    const SizedBox(width: 12),
                    Text(
                      'Appearance',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: textColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // 3-option selector
                Container(
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.darkBackground
                        : AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    children: [
                      _themeBtn(
                        icon: Icons.light_mode_rounded,
                        label: 'Light',
                        selected: currentMode == ThemeMode.light,
                        isDark: isDark,
                        accent: accent,
                        onTap: () => ref
                            .read(themeModeProvider.notifier)
                            .setThemeMode(ThemeMode.light),
                      ),
                      const SizedBox(width: 4),
                      _themeBtn(
                        icon: Icons.dark_mode_rounded,
                        label: 'Dark',
                        selected: currentMode == ThemeMode.dark,
                        isDark: isDark,
                        accent: accent,
                        onTap: () => ref
                            .read(themeModeProvider.notifier)
                            .setThemeMode(ThemeMode.dark),
                      ),
                      const SizedBox(width: 4),
                      _themeBtn(
                        icon: Icons.settings_suggest_rounded,
                        label: 'System',
                        selected: currentMode == ThemeMode.system,
                        isDark: isDark,
                        accent: accent,
                        onTap: () => ref
                            .read(themeModeProvider.notifier)
                            .setThemeMode(ThemeMode.system),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // ── Main settings ──
          Container(
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(16),
              border: isDark
                  ? Border.all(
                      color: AppColors.darkOutline.withOpacity(0.5),
                      width: 0.5)
                  : null,
            ),
            child: Column(
              children: [
                SwitchListTile(
                  value: _notificationsEnabled ?? true,
                  secondary:
                      Icon(Icons.notifications_outlined, color: accent),
                  title: const Text('Notifications'),
                  subtitle: const Text(
                      'Advisories and report status updates'),
                  onChanged: _notificationsEnabled == null
                      ? null
                      : (v) async {
                          setState(() => _notificationsEnabled = v);
                          await _notificationSettings.setEnabled(v);
                          if (v) {
                            await NotificationService.instance.initialize();
                            await NotificationService.instance
                                .requestPermissionIfNeeded();
                            var fcmStarted = false;
                            try {
                              await FcmPushService.instance.enable();
                              fcmStarted = true;
                            } catch (_) {
                              fcmStarted = false;
                            }
                            if (!fcmStarted) {
                              await RealtimeNotificationService.instance
                                  .start();
                            } else {
                              await RealtimeNotificationService.instance
                                  .stop();
                            }
                          } else {
                            FcmPushService.instance.disable();
                            await RealtimeNotificationService.instance.stop();
                          }
                        },
                ),
                const Divider(height: 1),
                _tile(Icons.person_outline, context.l10n.profile, accent,
                    () => _push(const ProfileModuleScreen())),
                const Divider(height: 1),
                _tile(Icons.emoji_events_outlined, 'Achievements & Badges',
                    accent, () => _push(const AchievementsScreen())),
                const Divider(height: 1),
                _tile(Icons.download_for_offline_outlined, 'Offline Maps',
                    accent, () => _push(const OfflineMapsScreen())),
                const Divider(height: 1),
                _tile(Icons.help_outline, context.l10n.helpFaq, accent,
                    () => _push(const HelpFaqScreen())),
                const Divider(height: 1),
                _tile(Icons.info_outline, context.l10n.aboutTransparency,
                    accent,
                    () => _push(const AboutTransparencyScreen())),
                const Divider(height: 1),
                _tile(
                    Icons.language,
                    context.l10n.language,
                    accent,
                    () => _push(
                        const LanguageScreen(fromSettings: true))),
                const Divider(height: 1),
                _tile(Icons.privacy_tip_outlined,
                    context.l10n.privacyControls, accent,
                    () => _push(const PrivacyControlsScreen())),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // ── Logout ──
          Container(
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(16),
              border: isDark
                  ? Border.all(
                      color: AppColors.darkOutline.withOpacity(0.5),
                      width: 0.5)
                  : null,
            ),
            child: ListTile(
              leading: Icon(Icons.logout,
                  color: isDark ? AppColors.darkError : AppColors.error),
              title: Text(
                'Log out',
                style: TextStyle(
                  color: isDark ? AppColors.darkError : AppColors.error,
                  fontWeight: FontWeight.w700,
                ),
              ),
              onTap: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Log out?'),
                    content: const Text(
                        'You will need to verify your phone again to sign back in.'),
                    actions: [
                      TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: Text(context.l10n.cancel)),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isDark
                              ? AppColors.darkError
                              : AppColors.error,
                          foregroundColor: Colors.white,
                          elevation: 0,
                        ),
                        child: const Text('Log out'),
                      ),
                    ],
                  ),
                );
                if (ok != true) return;
                await ref.read(authStateProvider.notifier).signOut();
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove('user_phone');
                if (!context.mounted) return;
                Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (_) => false);
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── helpers ──

  void _push(Widget screen) =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  Widget _tile(IconData icon, String title, Color iconColor,
      VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: iconColor),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  Widget _themeBtn({
    required IconData icon,
    required String label,
    required bool selected,
    required bool isDark,
    required Color accent,
    required VoidCallback onTap,
  }) {
    final selBg = isDark ? AppColors.darkElevated : Colors.white;
    final selTxt = accent;
    final unTxt = isDark
        ? AppColors.darkTextSecondary
        : AppColors.textSecondary;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? selBg : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: selected
                ? [
                    BoxShadow(
                        color: accent.withOpacity(0.15),
                        blurRadius: 8,
                        offset: const Offset(0, 2))
                  ]
                : null,
          ),
          child: Column(
            children: [
              Icon(icon,
                  size: 20,
                  color: selected ? selTxt : unTxt),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight:
                      selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? selTxt : unTxt,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
