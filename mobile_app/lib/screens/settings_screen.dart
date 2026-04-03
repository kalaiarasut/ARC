import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
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
  String? _zoneMonitoringDiagnosticMessage;
  String? _zoneMonitoringDiagnosticStatus;

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
    final diagnostic = await ZoneMonitoringService.getLatestDiagnostic();
    if (!mounted) return;
    setState(() {
      _zoneMonitoringEnabled = status.enabled;
      _zoneMonitoringMode = status.mode;
      _zoneMonitoringDiagnosticMessage = diagnostic['message'];
      _zoneMonitoringDiagnosticStatus = diagnostic['status'];
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

  Future<bool> _confirmZoneMonitoringDialog({
    required String title,
    required String message,
    required String confirmLabel,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Not now'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(confirmLabel),
          ),
        ],
      ),
    );

    return result ?? false;
  }

  Future<bool> _showZoneMonitoringPurposeDialog() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Enable Safety Zone Monitoring'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'We use this device location to detect when you enter or exit safety zones and send alerts when needed.',
            ),
            SizedBox(height: 12),
            Text(
              'For full protection, choose "Allow all the time" and keep precise location on. That lets alerts continue even after the app is closed.',
            ),
            SizedBox(height: 12),
            Text(
              'Privacy: live location is used for safety monitoring. In normal monitoring it is anonymized. Exact location is only available to authorized emergency operators during an active incident.',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Not now'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Continue'),
          ),
        ],
      ),
    );

    return result ?? false;
  }

  Future<bool> _waitForLocationServicesEnabled() async {
    for (var attempt = 0; attempt < 30; attempt++) {
      if (await Geolocator.isLocationServiceEnabled()) {
        return true;
      }
      await Future.delayed(const Duration(seconds: 1));
    }
    return Geolocator.isLocationServiceEnabled();
  }

  Future<bool> _waitForLocationPermissionGranted() async {
    for (var attempt = 0; attempt < 30; attempt++) {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        return true;
      }
      await Future.delayed(const Duration(seconds: 1));
    }

    final permission = await Geolocator.checkPermission();
    return permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;
  }

  void _showZoneMonitoringSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _sendTestZoneHeartbeat() async {
    _showZoneMonitoringSnackBar('Sending test heartbeat...');
    final error = await ZoneMonitoringService.instance.sendTestHeartbeatNow();
    await _loadZoneMonitoringSetting();
    if (!mounted) return;
    if (error == null) {
      _showZoneMonitoringSnackBar(
        'Test heartbeat sent. Refresh the admin map now.',
      );
    } else {
      _showZoneMonitoringSnackBar(error);
    }
  }

  Future<void> _handleEnableZoneMonitoring() async {
    final shouldContinue = await _showZoneMonitoringPurposeDialog();
    if (!shouldContinue) {
      await _loadZoneMonitoringSetting();
      _showZoneMonitoringSnackBar(
        'Safety Zone Monitoring stays off until you allow location access.',
      );
      return;
    }

    final gpsEnabled = await Geolocator.isLocationServiceEnabled();
    if (!gpsEnabled) {
      final shouldOpenSettings = await _confirmZoneMonitoringDialog(
        title: 'Turn on GPS',
        message:
            'Safety Zone Monitoring needs Android location services to detect when this device enters or exits a zone. On the next permission screen, choose "Allow all the time" and keep precise location on for full protection.',
        confirmLabel: 'Open location settings',
      );

      if (!shouldOpenSettings) {
        await _loadZoneMonitoringSetting();
        _showZoneMonitoringSnackBar(
          'Safety Zone Monitoring stays off until GPS is enabled.',
        );
        return;
      }

      await Geolocator.openLocationSettings();
      final enabledAfterPrompt = await _waitForLocationServicesEnabled();
      if (!enabledAfterPrompt) {
        await _loadZoneMonitoringSetting();
        _showZoneMonitoringSnackBar(
          'GPS is still off. Turn on location services to enable Safety Zone Monitoring.',
        );
        return;
      }
    }

    var status = await ZoneMonitoringService.instance.enable();

    if (!mounted) return;

    if (!status.enabled && status.mode == ZoneMonitoringMode.locationDenied) {
      final shouldOpenAppSettings = await _confirmZoneMonitoringDialog(
        title: 'Allow location access',
        message:
            'Safety Zone Monitoring needs location permission to warn you about zone entry and exit. Choose "Allow all the time" and keep precise location on. We use location for safety monitoring and only show exact location to authorized emergency operators during active incidents.',
        confirmLabel: 'Open app settings',
      );

      if (shouldOpenAppSettings) {
        await Geolocator.openAppSettings();
        final grantedAfterPrompt = await _waitForLocationPermissionGranted();
        if (grantedAfterPrompt) {
          status = await ZoneMonitoringService.instance.enable();
        }
      }
    }

    if (!mounted) return;

    setState(() {
      _notificationsEnabled = status.enabled ? true : _notificationsEnabled;
      _zoneMonitoringEnabled = status.enabled;
      _zoneMonitoringMode = status.mode;
    });

    if (!status.enabled) {
      switch (status.mode) {
        case ZoneMonitoringMode.locationServicesOff:
          _showZoneMonitoringSnackBar(
            'GPS must be on before Safety Zone Monitoring can start.',
          );
          break;
        case ZoneMonitoringMode.locationDenied:
          _showZoneMonitoringSnackBar(
            'Location permission is required for Safety Zone Monitoring.',
          );
          break;
        case ZoneMonitoringMode.signedOut:
          _showZoneMonitoringSnackBar(
            'Sign in again to enable Safety Zone Monitoring on this device.',
          );
          break;
        default:
          _showZoneMonitoringSnackBar(
            'Safety Zone Monitoring could not be enabled on this device.',
          );
      }
      await _loadZoneMonitoringSetting();
      return;
    }

    if (status.mode == ZoneMonitoringMode.foregroundOnly) {
      _showZoneMonitoringSnackBar(
        'Safety Zone Monitoring is on. Background location was not granted, so alerts work while the app is open.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final accent = isDark ? AppColors.darkSecondaryCyan : AppColors.primaryBlue;
    final textColor = isDark
        ? AppColors.darkTextPrimary
        : AppColors.textPrimary;
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
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(16),
              border: isDark
                  ? Border.all(
                      color: AppColors.darkOutline.withOpacity(0.5),
                      width: 0.5,
                    )
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
                      width: 0.5,
                    )
                  : null,
            ),
            child: Column(
              children: [
                SwitchListTile(
                  value: _notificationsEnabled ?? true,
                  secondary: Icon(Icons.notifications_outlined, color: accent),
                  title: Text(context.l10n.notifications),
                  subtitle: const Text('Advisories and report status updates'),
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
                              await RealtimeNotificationService.instance.stop();
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
                          if (v) {
                            setState(() => _zoneMonitoringEnabled = true);
                            await _handleEnableZoneMonitoring();
                          } else {
                            setState(() => _zoneMonitoringEnabled = false);
                            await ZoneMonitoringService.instance.disable();
                            await _loadZoneMonitoringSetting();
                          }
                        },
                ),
                if ((_zoneMonitoringEnabled ?? false) ||
                    _zoneMonitoringDiagnosticMessage?.isNotEmpty == true)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_zoneMonitoringDiagnosticMessage?.isNotEmpty ==
                            true)
                          Text(
                            'Heartbeat status: ${_zoneMonitoringDiagnosticStatus ?? 'unknown'}'
                            '${_zoneMonitoringDiagnosticMessage!.isNotEmpty ? ' - ${_zoneMonitoringDiagnosticMessage!}' : ''}',
                            style: TextStyle(
                              fontSize: 12,
                              color: _zoneMonitoringDiagnosticStatus == 'failed'
                                  ? (isDark
                                        ? AppColors.darkError
                                        : AppColors.error)
                                  : textColor.withOpacity(0.72),
                              fontWeight:
                                  _zoneMonitoringDiagnosticStatus == 'failed'
                                  ? FontWeight.w600
                                  : FontWeight.w500,
                            ),
                          ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: (_zoneMonitoringEnabled ?? false)
                                ? _sendTestZoneHeartbeat
                                : null,
                            icon: const Icon(
                              Icons.my_location_outlined,
                              size: 18,
                            ),
                            label: const Text('Send test heartbeat now'),
                          ),
                        ),
                      ],
                    ),
                  ),
                const Divider(height: 1),
                _tile(
                  Icons.person_outline,
                  context.l10n.profile,
                  accent,
                  () => _push(const ProfileModuleScreen()),
                ),
                const Divider(height: 1),
                _tile(
                  Icons.emoji_events_outlined,
                  context.l10n.achievementsAndBadges,
                  accent,
                  () => _push(const AchievementsScreen()),
                ),
                const Divider(height: 1),
                _tile(
                  Icons.download_for_offline_outlined,
                  context.l10n.offlineMaps,
                  accent,
                  () => _push(const OfflineMapsScreen()),
                ),
                const Divider(height: 1),
                _tile(
                  Icons.help_outline,
                  context.l10n.helpFaq,
                  accent,
                  () => _push(const HelpFaqScreen()),
                ),
                const Divider(height: 1),
                _tile(
                  Icons.info_outline,
                  context.l10n.aboutTransparency,
                  accent,
                  () => _push(const AboutTransparencyScreen()),
                ),
                const Divider(height: 1),
                _tile(
                  Icons.language,
                  context.l10n.language,
                  accent,
                  () => _push(const LanguageScreen(fromSettings: true)),
                ),
                const Divider(height: 1),
                _tile(
                  Icons.privacy_tip_outlined,
                  context.l10n.privacyControls,
                  accent,
                  () => _push(const PrivacyControlsScreen()),
                ),
                const Divider(height: 1),
                _tile(
                  Icons.favorite_outline,
                  'Support Us / Donate',
                  accent,
                  () => _push(const DonationAmountScreen()),
                ),
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
                      width: 0.5,
                    )
                  : null,
            ),
            child: ListTile(
              leading: Icon(
                Icons.logout,
                color: isDark ? AppColors.darkError : AppColors.error,
              ),
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
                      'You will need to verify your phone again to sign back in.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: Text(context.l10n.cancel),
                      ),
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
                  (_) => false,
                );
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

  Widget _tile(
    IconData icon,
    String title,
    Color iconColor,
    VoidCallback onTap,
  ) {
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
    ThemeData resolveTargetTheme(BuildContext themeContext) {
      final resolvedBrightness = targetMode == ThemeMode.system
          ? MediaQuery.platformBrightnessOf(themeContext)
          : (targetMode == ThemeMode.dark
                ? Brightness.dark
                : Brightness.light);
      return resolvedBrightness == Brightness.dark
          ? AppTheme.darkTheme
          : AppTheme.lightTheme;
    }

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
                final targetTheme = resolveTargetTheme(switcherContext);
                ThemeSwitcher.of(switcherContext).changeTheme(
                  theme: targetTheme,
                );
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
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Column(
                children: [
                  Icon(icon, size: 20, color: selected ? selTxt : unTxt),
                  const SizedBox(height: 4),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
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
