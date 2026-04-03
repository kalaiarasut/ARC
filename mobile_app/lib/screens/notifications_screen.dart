import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../core/supabase_config.dart';
import '../services/advisory_service.dart';
import '../models/advisory_category.dart';
import '../l10n/l10n.dart';
import '../l10n/app_localizations.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<_NotificationItem> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _loading = true);
    try {
      final l10n = context.l10n;
      final languageCode = Localizations.localeOf(context).languageCode;
      final advisories = await AdvisoryService().getLatest(limit: 20);

      // Fetch recent report status changes for this user
      final userId = SupabaseConfig.client.auth.currentSession?.user.id ?? SupabaseConfig.client.auth.currentUser?.id;
      List<_NotificationItem> reportNotifs = [];
      if (userId != null) {
        try {
          final response = await SupabaseConfig.client
              .from('hazard_reports')
              .select('id, hazard_type, status, updated_at')
              .eq('user_id', userId)
              .neq('status', 'pending')
              .order('updated_at', ascending: false)
              .limit(20);

          reportNotifs = (response as List).map((r) {
            final status = r['status'] as String;
            return _NotificationItem(
              icon: status == 'verified'
                  ? Icons.verified
                  : status == 'rejected'
                  ? Icons.cancel
                  : Icons.check_circle,
              iconColor: status == 'verified'
                  ? Colors.green
                  : status == 'rejected'
                  ? AppColors.error
                  : AppColors.primaryBlue,
              title: l10n.reportStatusTitle(status.toString().toUpperCase()),
              body: l10n.reportStatusBody(r['hazard_type'], status),
              time: DateTime.tryParse(r['updated_at'] ?? '') ?? DateTime.now(),
              type: _NotifType.report,
            );
          }).toList();
        } catch (_) {}
      }

      final advisoryNotifs = advisories.map((a) {
        final severityColor = a.severity.toLowerCase() == 'warning'
            ? AppColors.error
            : a.severity.toLowerCase() == 'watch'
            ? AppColors.warning
            : AppColors.primaryBlue;
        return _NotificationItem(
          icon: Icons.campaign,
          iconColor: severityColor,
          title: a.title,
          body:
              a.region ??
              advisorySeverityLabelForLanguage(
                a.severity,
                languageCode,
              ).toUpperCase(),
          time: a.publishedAt,
          type: _NotifType.advisory,
        );
      }).toList();

      final all = [...reportNotifs, ...advisoryNotifs];
      all.sort((a, b) => b.time.compareTo(a.time));

      if (!mounted) return;
      setState(() {
        _items = all;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  String _timeAgo(DateTime dt, AppLocalizations l10n) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return l10n.justNow;
    if (diff.inMinutes < 60) return l10n.minutesAgo(diff.inMinutes);
    if (diff.inHours < 24) return l10n.hoursAgo(diff.inHours);
    return l10n.daysAgo(diff.inDays);
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
          context.l10n.notificationsTitle,
          style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextPrimary
                : AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_off_outlined,
                    size: 56,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    context.l10n.noNotificationsYet,
                    style: TextStyle(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextSecondary
                          : AppColors.textSecondary,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadNotifications,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final item = _items[index];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: item.iconColor.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            item.icon,
                            color: item.iconColor,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color:
                                      Theme.of(context).brightness ==
                                          Brightness.dark
                                      ? AppColors.darkTextPrimary
                                      : AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item.body,
                                style: TextStyle(
                                  color:
                                      Theme.of(context).brightness ==
                                          Brightness.dark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.textSecondary,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _timeAgo(item.time, context.l10n),
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}

enum _NotifType { advisory, report }

class _NotificationItem {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String body;
  final DateTime time;
  final _NotifType type;

  const _NotificationItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.body,
    required this.time,
    required this.type,
  });
}
