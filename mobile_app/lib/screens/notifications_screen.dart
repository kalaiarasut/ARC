import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../core/supabase_config.dart';
import '../services/advisory_service.dart';

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
      final advisories = await AdvisoryService().getLatest(limit: 20);

      // Fetch recent report status changes for this user
      final userId = SupabaseConfig.client.auth.currentUser?.id;
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
              title: 'Report ${status.toString().toUpperCase()}',
              body: 'Your ${r['hazard_type']} report has been $status.',
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
          body: a.region ?? a.severity.toUpperCase(),
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

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
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
        title: const Text(
          'Notifications',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_off_outlined, size: 56, color: Colors.grey[400]),
                      const SizedBox(height: 12),
                      const Text(
                        'No notifications yet',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: item.iconColor.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(item.icon, color: item.iconColor, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item.body,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _timeAgo(item.time),
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
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
