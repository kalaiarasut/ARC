import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/citizen_stats.dart';
import '../providers/gamification_provider.dart';
import '../theme/app_colors.dart';
import 'leaderboard_screen.dart';

class AchievementsScreen extends ConsumerWidget {
  const AchievementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(citizenStatsProvider);
    final allBadgesAsync = ref.watch(allBadgesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Achievements'),
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.leaderboard_outlined),
            tooltip: 'Leaderboard',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const LeaderboardScreen()),
            ),
          ),
        ],
      ),
      body: statsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error loading stats: $e')),
        data: (stats) => allBadgesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error loading badges: $e')),
          data: (allBadges) => RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(citizenStatsProvider);
              ref.invalidate(allBadgesProvider);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildStatsCard(stats),
                const SizedBox(height: 20),
                _buildSectionTitle(context, 'Earned Badges', stats.badges.length, isDark),
                const SizedBox(height: 12),
                _buildEarnedBadges(context, stats.badges),
                const SizedBox(height: 24),
                _buildSectionTitle(
                  context,
                  'Locked Badges',
                  allBadges.length - stats.badges.length,
                  isDark,
                ),
                const SizedBox(height: 12),
                _buildLockedBadges(context, allBadges, stats.badges),
                const SizedBox(height: 24),
                _buildSectionTitle(context, 'Points History', stats.recentPoints.length, isDark),
                const SizedBox(height: 12),
                _buildPointsHistory(context, stats.recentPoints),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatsCard(CitizenStats stats) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF088395), Color(0xFF05BFDB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF088395).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${stats.totalPoints}',
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const Text(
                    'Total Points',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
              if (stats.rank > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.emoji_events, color: Colors.amber, size: 20),
                      const SizedBox(width: 6),
                      Text(
                        '#${stats.rank}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildMiniStat('Reports', stats.totalReports),
              const SizedBox(width: 16),
              _buildMiniStat('Verified', stats.verifiedCount),
              const SizedBox(width: 16),
              _buildMiniStat(
                'Rate',
                '${(stats.verificationRate * 100).toStringAsFixed(0)}%',
              ),
              const SizedBox(width: 16),
              _buildMiniStat('Badges', stats.badges.length),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, dynamic value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              '$value',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 10, color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title, int count, bool isDark) {
    return Row(
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.primaryBlue.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            '$count',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryBlue,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEarnedBadges(BuildContext context, List<EarnedBadge> badges) {
    if (badges.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Column(
            children: [
              Icon(Icons.emoji_events_outlined, size: 40, color: Colors.grey),
              SizedBox(height: 8),
              Text(
                'Submit your first report to earn a badge!',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.85,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: badges.length,
      itemBuilder: (context, index) {
        final badge = badges[index];
        return _BadgeTile(
          icon: _iconFromString(badge.icon),
          name: badge.name,
          isEarned: true,
          onTap: () => _showBadgeDetail(context, badge.name, badge.description, true),
        );
      },
    );
  }

  Widget _buildLockedBadges(BuildContext context, List<BadgeDefinition> all, List<EarnedBadge> earned) {
    final earnedIds = earned.map((e) => e.badgeId).toSet();
    final locked = all.where((b) => !earnedIds.contains(b.id)).toList();

    if (locked.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Text(
            '🎉 All badges earned!',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.85,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: locked.length,
      itemBuilder: (context, index) {
        final badge = locked[index];
        return _BadgeTile(
          icon: _iconFromString(badge.icon),
          name: badge.name,
          isEarned: false,
          onTap: () => _showBadgeDetail(context, badge.name, badge.description, false),
        );
      },
    );
  }

  Widget _buildPointsHistory(BuildContext context, List<PointEntry> entries) {
    if (entries.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Text('No points history yet', style: TextStyle(color: Colors.grey)),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(vertical: 4),
        itemCount: entries.length,
        separatorBuilder: (_, __) => const Divider(height: 1, indent: 56),
        itemBuilder: (context, index) {
          final entry = entries[index];
          final isPositive = entry.points > 0;
          return ListTile(
            leading: CircleAvatar(
              backgroundColor: isPositive
                  ? Colors.green.withOpacity(0.1)
                  : Colors.red.withOpacity(0.1),
              radius: 18,
              child: Text(
                isPositive ? '+${entry.points}' : '${entry.points}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isPositive ? Colors.green : Colors.red,
                ),
              ),
            ),
            title: Text(
              entry.reasonLabel,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            trailing: Text(
              _timeAgo(entry.createdAt),
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          );
        },
      ),
    );
  }

  void _showBadgeDetail(BuildContext context, String name, String desc, bool earned) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(desc),
            const SizedBox(height: 12),
            Text(
              earned ? '✅ Earned!' : '🔒 Not yet earned',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: earned ? Colors.green : Colors.grey,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  IconData _iconFromString(String name) {
    const map = {
      'water_drop': Icons.water_drop,
      'sensors': Icons.sensors,
      'verified_user': Icons.verified_user,
      'camera_alt': Icons.camera_alt,
      'bolt': Icons.bolt,
      'emoji_events': Icons.emoji_events,
      'star': Icons.star,
      'gps_fixed': Icons.gps_fixed,
      'local_fire_department': Icons.local_fire_department,
      'explore': Icons.explore,
    };
    return map[name] ?? Icons.emoji_events;
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _BadgeTile extends StatelessWidget {
  final IconData icon;
  final String name;
  final bool isEarned;
  final VoidCallback? onTap;

  const _BadgeTile({
    required this.icon,
    required this.name,
    required this.isEarned,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: isEarned
              ? Border.all(color: const Color(0xFF088395), width: 1.5)
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isEarned
                    ? const Color(0xFF088395).withOpacity(0.1)
                    : Colors.grey.withOpacity(isDark ? 0.3 : 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 24,
                color: isEarned ? const Color(0xFF088395) : Colors.grey,
              ),
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isEarned ? (isDark ? AppColors.darkTextPrimary : AppColors.textPrimary) : Colors.grey,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
