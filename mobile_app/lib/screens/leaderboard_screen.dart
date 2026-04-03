import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/citizen_stats.dart';
import '../providers/gamification_provider.dart';
import '../core/supabase_config.dart';
import '../theme/app_colors.dart';
import '../l10n/l10n.dart';

class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(leaderboardProvider);
    final currentUserId = SupabaseConfig.client.auth.currentSession?.user.id ?? SupabaseConfig.client.auth.currentUser?.id;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(context.l10n.leaderboardTitle),
        backgroundColor: Colors.transparent,
        foregroundColor: isDark
            ? AppColors.darkTextPrimary
            : AppColors.textPrimary,
        elevation: 0,
      ),
      body: leaderboardAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(context.l10n.error(e.toString()))),
        data: (entries) {
          if (entries.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.leaderboard_outlined,
                    size: 56,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    context.l10n.noLeaderboardData,
                    style: const TextStyle(color: Colors.grey, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    context.l10n.startReportingToClimb,
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(leaderboardProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (entries.length >= 3) ...[
                  _buildPodium(
                    context,
                    entries.take(3).toList(),
                    currentUserId,
                  ),
                  const SizedBox(height: 20),
                ],
                _buildRankList(context, entries, currentUserId),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPodium(
    BuildContext context,
    List<LeaderboardEntry> top3,
    String? currentUserId,
  ) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // 2nd place
        Expanded(
          child: _buildPodiumItem(
            context,
            top3[1],
            2,
            currentUserId,
            height: 100,
          ),
        ),
        const SizedBox(width: 8),
        // 1st place
        Expanded(
          child: _buildPodiumItem(
            context,
            top3[0],
            1,
            currentUserId,
            height: 130,
          ),
        ),
        const SizedBox(width: 8),
        // 3rd place
        Expanded(
          child: _buildPodiumItem(
            context,
            top3[2],
            3,
            currentUserId,
            height: 80,
          ),
        ),
      ],
    );
  }

  Widget _buildPodiumItem(
    BuildContext context,
    LeaderboardEntry entry,
    int position,
    String? currentUserId, {
    required double height,
  }) {
    final isMe = entry.userId == currentUserId;
    final colors = {
      1: [const Color(0xFFFFD700), const Color(0xFFFFA000)],
      2: [const Color(0xFFC0C0C0), const Color(0xFF9E9E9E)],
      3: [const Color(0xFFCD7F32), const Color(0xFF8D6E63)],
    };
    final medalIcons = {1: '🥇', 2: '🥈', 3: '🥉'};

    return Container(
      height: height + 60,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors[position]!,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: isMe
            ? Border.all(color: AppColors.primaryBlue, width: 2.5)
            : null,
        boxShadow: [
          BoxShadow(
            color: (colors[position]![0]).withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(medalIcons[position]!, style: const TextStyle(fontSize: 28)),
          const SizedBox(height: 4),
          Text(
            _truncateName(entry.userName),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: position == 1 ? Colors.black87 : Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            context.l10n.pointsAbbrev(entry.totalPoints),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: position == 1 ? Colors.black : Colors.white,
            ),
          ),
          Text(
            context.l10n.reportCountDesc(entry.reportCount),
            style: TextStyle(
              fontSize: 10,
              color: position == 1 ? Colors.black54 : Colors.white70,
            ),
          ),
          if (isMe)
            Container(
              margin: const EdgeInsets.only(top: 4),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.3),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                context.l10n.you,
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildRankList(
    BuildContext context,
    List<LeaderboardEntry> entries,
    String? currentUserId,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
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
        separatorBuilder: (_, _) => const Divider(height: 1, indent: 56),
        itemBuilder: (context, index) {
          final entry = entries[index];
          final isMe = entry.userId == currentUserId;
          return Container(
            color: isMe ? AppColors.primaryBlue.withOpacity(0.05) : null,
            child: ListTile(
              leading: SizedBox(
                width: 36,
                child: Center(
                  child: index < 3
                      ? Text(
                          ['🥇', '🥈', '🥉'][index],
                          style: const TextStyle(fontSize: 20),
                        )
                      : Text(
                          '#${entry.rank}',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isMe ? AppColors.primaryBlue : Colors.grey,
                          ),
                        ),
                ),
              ),
              title: Row(
                children: [
                  Expanded(
                    child: Text(
                      entry.userName,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: isMe ? FontWeight.bold : FontWeight.w500,
                        color: isMe
                            ? AppColors.primaryBlue
                            : (isDark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.textPrimary),
                      ),
                    ),
                  ),
                  if (isMe)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primaryBlue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        context.l10n.you,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryBlue,
                        ),
                      ),
                    ),
                ],
              ),
              subtitle: Text(
                context.l10n.reportCountDesc(entry.reportCount),
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              trailing: Text(
                context.l10n.pointsAbbrev(entry.totalPoints),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isMe
                      ? AppColors.primaryBlue
                      : (isDark
                            ? AppColors.darkTextPrimary
                            : AppColors.textPrimary),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _truncateName(String name) {
    return name.length > 12 ? '${name.substring(0, 10)}…' : name;
  }
}
