import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:animated_theme_switcher/animated_theme_switcher.dart';

import '../l10n/l10n.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../services/fcm_push_service.dart';
import '../services/notification_settings_service.dart';
import '../services/notification_service.dart';
import '../services/realtime_notification_service.dart';
import '../services/zone_monitoring_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'about_transparency_screen.dart';
import 'help_faq_screen.dart';
import 'language_screen.dart';
import 'login_screen.dart';
import 'profile_module_screen.dart';
import 'privacy_controls_screen.dart';
import 'achievements_screen.dart';
import 'offline_maps_screen.dart';
import 'donation_screen.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final NotificationSettingsService _notificationSettings =
      NotificationSettingsService();
  bool? _notificationsEnabled;
  bool? _zoneMonitoringEnabled;
  ZoneMonitoringMode? _zoneMonitoringMode;

  @override
  void initState() {
    super.initState();
    _loadNotificationsSetting();
    _loadZoneMonitoringSetting();
  }

  Future<void> _loadNotificationsSetting() async {
    final enabled = await _notificationSettings.isEnabled();
    if (!mounted) return;
    setState(() => _notificationsEnabled = enabled);
  }

  Future<void> _loadZoneMonitoringSetting() async {
    final status = await ZoneMonitoringService.instance.getStatus();
    if (!mounted) return;
    setState(() {
      _zoneMonitoringEnabled = status.enabled;
      _zoneMonitoringMode = status.mode;
    });
  }

  String _zoneMonitoringSubtitle() {
    switch (_zoneMonitoringMode) {
      case ZoneMonitoringMode.backgroundActive:
        return 'Entry and exit alerts work in the foreground and periodic background checks.';
      case ZoneMonitoringMode.foregroundOnly:
        return 'Foreground only. Allow background location to keep zone alerts working after the app closes.';
      case ZoneMonitoringMode.locationServicesOff:
        return 'Location services are off. Turn on GPS to evaluate zone entry and exit.';
      case ZoneMonitoringMode.locationDenied:
        return 'Location permission is missing. The app cannot detect zone entry or exit yet.';
      case ZoneMonitoringMode.signedOut:
        return 'Sign in again to resume monitoring on this device.';
      case ZoneMonitoringMode.unsupported:
        return 'This feature is currently Android only.';
      case ZoneMonitoringMode.disabled:
      case null:
        return 'Uses current location to warn when this device enters or exits monitoring zones.';
    }
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
                      _animatedThemeBtn(
                        context: context,
                        ref: ref,
                        icon: Icons.light_mode_rounded,
                        label: context.l10n.themeLight,
                        selected: currentMode == ThemeMode.light,
                        isDark: isDark,
                        accent: accent,
                        targetMode: ThemeMode.light,
                      ),
                      const SizedBox(width: 4),
                      _animatedThemeBtn(
                        context: context,
                        ref: ref,
                        icon: Icons.dark_mode_rounded,
                        label: context.l10n.themeDark,
                        selected: currentMode == ThemeMode.dark,
                        isDark: isDark,
                        accent: accent,
                        targetMode: ThemeMode.dark,
                      ),
                      const SizedBox(width: 4),
                      _animatedThemeBtn(
                        context: context,
                        ref: ref,
                        icon: Icons.settings_suggest_rounded,
                        label: context.l10n.themeSystem,
                        selected: currentMode == ThemeMode.system,
                        isDark: isDark,
                        accent: accent,
                        targetMode: ThemeMode.system,
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
                  title: Text(context.l10n.notifications),
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
                SwitchListTile(
                  value: _zoneMonitoringEnabled ?? false,
                  secondary: Icon(Icons.shield_outlined, color: accent),
                  title: const Text('Safety Zone Monitoring'),
                  subtitle: Text(_zoneMonitoringSubtitle()),
                  onChanged: _zoneMonitoringEnabled == null
                      ? null
                      : (v) async {
                          setState(() => _zoneMonitoringEnabled = v);
                          if (v) {
                            final status = await ZoneMonitoringService.instance.enable();
                            if (!mounted) return;
                            setState(() {
                              _notificationsEnabled = true;
                              _zoneMonitoringEnabled = status.enabled;
                              _zoneMonitoringMode = status.mode;
                            });
                          } else {
                            await ZoneMonitoringService.instance.disable();
                            await _loadZoneMonitoringSetting();
                          }
                        },
                ),
                const Divider(height: 1),
                _tile(Icons.person_outline, context.l10n.profile, accent,
                    () => _push(const ProfileModuleScreen())),
                const Divider(height: 1),
                _tile(Icons.emoji_events_outlined, context.l10n.achievementsAndBadges,
                    accent, () => _push(const AchievementsScreen())),
                const Divider(height: 1),
                _tile(Icons.download_for_offline_outlined, context.l10n.offlineMaps,
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
                const Divider(height: 1),
                _tile(Icons.favorite_outline,
                    'Support Us / Donate', accent,
                    () => _push(const DonationAmountScreen())),
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
                context.l10n.logOut,
                style: TextStyle(
                  color: isDark ? AppColors.darkError : AppColors.error,
                  fontWeight: FontWeight.w700,
                ),
              ),
              onTap: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text(context.l10n.logOutTitle),
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
                        child: Text(context.l10n.logOut),
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

  Widget _animatedThemeBtn({
    required BuildContext context,
    required WidgetRef ref,
    required IconData icon,
    required String label,
    required bool selected,
    required bool isDark,
    required Color accent,
    required ThemeMode targetMode,
  }) {
    return Expanded(
      child: ThemeSwitcher(
        clipper: const ThemeSwitcherCircleClipper(),
        builder: (switcherContext) {
          final selBg = isDark ? AppColors.darkElevated : Colors.white;
          final selTxt = accent;
          final unTxt = isDark
              ? AppColors.darkTextSecondary
              : AppColors.textSecondary;
          return GestureDetector(
            onTap: () {
              // Determine the target theme
              final targetTheme = targetMode == ThemeMode.dark
                  ? AppTheme.darkTheme
                  : targetMode == ThemeMode.light
                      ? AppTheme.lightTheme
                      : (MediaQuery.platformBrightnessOf(context) == Brightness.dark
                          ? AppTheme.darkTheme
                          : AppTheme.lightTheme);

              // Trigger the circular reveal animation
              ThemeSwitcher.of(switcherContext).changeTheme(
                theme: targetTheme,
                isReversed: targetMode == ThemeMode.light,
              );

              // Persist the preference
              ref.read(themeModeProvider.notifier).setThemeMode(targetMode);
            },
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
          );
        },
      ),
    );
  }
}
