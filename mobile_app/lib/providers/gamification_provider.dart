import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/citizen_stats.dart';
import '../services/gamification_service.dart';
import '../core/supabase_config.dart';

final gamificationServiceProvider = Provider<GamificationService>((ref) {
  return GamificationService();
});

/// Provides the current user's gamification stats.
/// Refresh by invalidating this provider.
final citizenStatsProvider = FutureProvider<CitizenStats>((ref) async {
  final userId = SupabaseConfig.client.auth.currentSession?.user.id ?? SupabaseConfig.client.auth.currentUser?.id;
  if (userId == null) return CitizenStats.empty();
  final service = ref.read(gamificationServiceProvider);
  return service.getCitizenStats(userId);
});

/// Provides the global leaderboard.
final leaderboardProvider = FutureProvider<List<LeaderboardEntry>>((ref) async {
  final service = ref.read(gamificationServiceProvider);
  return service.getLeaderboard();
});

/// Provides all badge definitions (for locked badges UI).
final allBadgesProvider = FutureProvider<List<BadgeDefinition>>((ref) async {
  final service = ref.read(gamificationServiceProvider);
  return service.getAllBadges();
});
