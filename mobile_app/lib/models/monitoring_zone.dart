class MonitoringZoneCoordinate {
  final double lat;
  final double lng;

  const MonitoringZoneCoordinate({
    required this.lat,
    required this.lng,
  });
}

class MonitoringZone {
  final String id;
  final String name;
  final String description;
  final String shape; // circle | polygon
  final double centerLat;
  final double centerLng;
  final double radiusMeters;
  final List<MonitoringZoneCoordinate> polygonPoints;
  final int peopleCount;
  final DateTime createdAt;

  const MonitoringZone({
    required this.id,
    required this.name,
    required this.description,
    required this.shape,
    required this.centerLat,
    required this.centerLng,
    required this.radiusMeters,
    required this.polygonPoints,
    required this.peopleCount,
    required this.createdAt,
  });

  bool get isPolygon => shape == 'polygon' && polygonPoints.length >= 3;

  bool get isCircle => shape != 'polygon';

  factory MonitoringZone.fromJson(Map<String, dynamic> json) {
    final rawPoints = json['polygon_points'];
    final points = <MonitoringZoneCoordinate>[];

    if (rawPoints is List) {
      for (final item in rawPoints) {
        if (item is! Map) continue;
        final lat = double.tryParse(item['lat']?.toString() ?? '');
        final lng = double.tryParse(item['lng']?.toString() ?? '');
        if (lat == null || lng == null) continue;
        points.add(MonitoringZoneCoordinate(lat: lat, lng: lng));
      }
    }

    return MonitoringZone(
      id: json['id']?.toString() ?? '',
      name: (json['name'] as String?)?.trim().isNotEmpty == true
          ? json['name'] as String
          : ((json['shape']?.toString() == 'polygon') ? 'Polygon Zone' : 'Monitoring Zone'),
      description: (json['description'] as String?)?.trim() ?? '',
      shape: json['shape']?.toString() == 'polygon' ? 'polygon' : 'circle',
      centerLat: (json['center_lat'] as num?)?.toDouble() ?? 0,
      centerLng: (json['center_lng'] as num?)?.toDouble() ?? 0,
      radiusMeters: (json['radius_meters'] as num?)?.toDouble() ?? 0,
      polygonPoints: points,
      peopleCount: (json['people_count'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
