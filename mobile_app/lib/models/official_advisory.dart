class OfficialAdvisory {
  final String id;
  final String title;
  final String body;
  final String? region;
  final String severity; // info|watch|warning
  final String category; // food|shelter|medical|rescue|roadblock|warning|evacuation
  final double? latitude;
  final double? longitude;
  final DateTime? startsAt;
  final DateTime? expiresAt;
  final String? contactPhone;
  final String? contactWhatsapp;
  final String? contactHotline;
  final DateTime publishedAt;

  OfficialAdvisory({
    required this.id,
    required this.title,
    required this.body,
    this.region,
    required this.severity,
    required this.category,
    this.latitude,
    this.longitude,
    this.startsAt,
    this.expiresAt,
    this.contactPhone,
    this.contactWhatsapp,
    this.contactHotline,
    required this.publishedAt,
  });

  factory OfficialAdvisory.fromJson(Map<String, dynamic> json) {
    final latRaw = json['latitude'];
    final lngRaw = json['longitude'];
    final startsRaw = json['starts_at'];
    final expiresRaw = json['expires_at'];

    return OfficialAdvisory(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      region: json['region'] as String?,
      severity: (json['severity'] as String?) ?? 'info',
      category: (json['category'] as String?) ?? 'warning',
      latitude: latRaw is num ? latRaw.toDouble() : null,
      longitude: lngRaw is num ? lngRaw.toDouble() : null,
      startsAt: startsRaw is String ? DateTime.tryParse(startsRaw) : null,
      expiresAt: expiresRaw is String ? DateTime.tryParse(expiresRaw) : null,
      contactPhone: json['contact_phone'] as String?,
      contactWhatsapp: json['contact_whatsapp'] as String?,
      contactHotline: json['contact_hotline'] as String?,
      publishedAt: DateTime.parse(json['published_at'] as String),
    );
  }
}
