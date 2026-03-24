import '../l10n/app_localizations.dart';

/// Model for gamification data returned by `get_citizen_stats` RPC.
class CitizenStats {
  final int totalPoints;
  final int totalReports;
  final int verifiedCount;
  final int rejectedCount;
  final int rank;
  final List<EarnedBadge> badges;
  final List<PointEntry> recentPoints;

  const CitizenStats({
    required this.totalPoints,
    required this.totalReports,
    required this.verifiedCount,
    required this.rejectedCount,
    required this.rank,
    required this.badges,
    required this.recentPoints,
  });

  double get verificationRate =>
      totalReports > 0 ? verifiedCount / totalReports : 0.0;

  factory CitizenStats.empty() => const CitizenStats(
        totalPoints: 0,
        totalReports: 0,
        verifiedCount: 0,
        rejectedCount: 0,
        rank: 0,
        badges: [],
        recentPoints: [],
      );

  factory CitizenStats.fromJson(Map<String, dynamic> json) {
    return CitizenStats(
      totalPoints: (json['total_points'] as num?)?.toInt() ?? 0,
      totalReports: (json['total_reports'] as num?)?.toInt() ?? 0,
      verifiedCount: (json['verified_count'] as num?)?.toInt() ?? 0,
      rejectedCount: (json['rejected_count'] as num?)?.toInt() ?? 0,
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      badges: json['badges'] != null
          ? (json['badges'] as List).map((b) => EarnedBadge.fromJson(b as Map<String, dynamic>)).toList()
          : [],
      recentPoints: json['recent_points'] != null
          ? (json['recent_points'] as List).map((p) => PointEntry.fromJson(p as Map<String, dynamic>)).toList()
          : [],
    );
  }
}

class EarnedBadge {
  final String badgeId;
  final String name;
  final String description;
  final String icon;
  final String category;
  final DateTime earnedAt;

  const EarnedBadge({
    required this.badgeId,
    required this.name,
    required this.description,
    required this.icon,
    required this.category,
    required this.earnedAt,
  });

  factory EarnedBadge.fromJson(Map<String, dynamic> json) {
    return EarnedBadge(
      badgeId: json['badge_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      icon: json['icon'] as String,
      category: (json['category'] as String?) ?? 'general',
      earnedAt: DateTime.parse(json['earned_at'] as String),
    );
  }
}

class PointEntry {
  final int points;
  final String reason;
  final DateTime createdAt;

  const PointEntry({
    required this.points,
    required this.reason,
    required this.createdAt,
  });

  factory PointEntry.fromJson(Map<String, dynamic> json) {
    return PointEntry(
      points: (json['points'] as num).toInt(),
      reason: json['reason'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  String reasonLabel(AppLocalizations l10n) {
    switch (reason) {
      case 'report_submitted': return l10n.reportSubmittedReason;
      case 'report_verified': return l10n.reportVerifiedReason;
      case 'high_risk_verified': return l10n.highRiskVerifiedReason;
      case 'report_rejected': return l10n.reportRejectedReason;
      default: return reason;
    }
  }
}

/// Model for leaderboard entries from `get_leaderboard` RPC.
class LeaderboardEntry {
  final String userId;
  final String userName;
  final int totalPoints;
  final int reportCount;
  final int rank;

  const LeaderboardEntry({
    required this.userId,
    required this.userName,
    required this.totalPoints,
    required this.reportCount,
    required this.rank,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      userId: json['user_id'] as String,
      userName: json['user_name'] as String? ?? 'Anonymous',
      totalPoints: (json['total_points'] as num?)?.toInt() ?? 0,
      reportCount: (json['report_count'] as num?)?.toInt() ?? 0,
      rank: (json['rank'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Model for a badge definition (all possible badges).
class BadgeDefinition {
  final String id;
  final String name;
  final String description;
  final String icon;
  final String category;
  final int? pointsThreshold;
  final int sortOrder;

  const BadgeDefinition({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.category,
    this.pointsThreshold,
    required this.sortOrder,
  });

  factory BadgeDefinition.fromJson(Map<String, dynamic> json) {
    return BadgeDefinition(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      icon: json['icon'] as String,
      category: (json['category'] as String?) ?? 'general',
      pointsThreshold: json['points_threshold'] as int?,
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
    );
  }
}
