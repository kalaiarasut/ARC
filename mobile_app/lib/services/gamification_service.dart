import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/supabase_config.dart';
import '../models/citizen_stats.dart';

/// Service for gamification RPCs. Follows existing stateless pattern.
class GamificationService {
  final SupabaseClient _supabase = SupabaseConfig.client;

  /// Fetch the authenticated user's gamification stats.
  Future<CitizenStats> getCitizenStats(String userId) async {
    final response = await _supabase.rpc(
      'get_citizen_stats',
      params: {'p_user_id': userId},
    );
    if (response == null) return CitizenStats.empty();
    return CitizenStats.fromJson(response as Map<String, dynamic>);
  }

  /// Fetch the global leaderboard.
  Future<List<LeaderboardEntry>> getLeaderboard({int limit = 20}) async {
    final response = await _supabase.rpc(
      'get_leaderboard',
      params: {'p_limit': limit},
    );
    if (response == null) return [];
    return (response as List)
        .map((e) => LeaderboardEntry.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Fetch all possible badge definitions.
  Future<List<BadgeDefinition>> getAllBadges() async {
    final response = await _supabase.rpc('get_all_badges');
    if (response == null) return [];
    return (response as List)
        .map((e) => BadgeDefinition.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
