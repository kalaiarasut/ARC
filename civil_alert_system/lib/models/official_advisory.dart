class OfficialAdvisory {
  final String id;
  final String title;
  final String body;
  final String? region;
  final String severity; // info|watch|warning
  final DateTime publishedAt;

  OfficialAdvisory({
    required this.id,
    required this.title,
    required this.body,
    this.region,
    required this.severity,
    required this.publishedAt,
  });

  factory OfficialAdvisory.fromJson(Map<String, dynamic> json) {
    return OfficialAdvisory(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      region: json['region'] as String?,
      severity: (json['severity'] as String?) ?? 'info',
      publishedAt: DateTime.parse(json['published_at'] as String),
    );
  }
}
