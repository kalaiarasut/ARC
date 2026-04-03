import 'package:uuid/uuid.dart';
import 'package:latlong2/latlong.dart';
import '../core/location_privacy.dart';
import 'map_marker_data.dart';

class HazardReport {
  static const String immediateDangerYes = 'yes';
  static const String immediateDangerNo = 'no';
  static const String immediateDangerNotSure = 'not_sure';

  static const String affectedPeopleUnknown = 'unknown';
  static const String affectedPeople1To5 = '1_5';
  static const String affectedPeople6To20 = '6_20';
  static const String affectedPeople21To50 = '21_50';
  static const String affectedPeople50Plus = '50_plus';

  final String? id; // DB-generated UUID
  final String clientId; // Client-generated UUID (idempotency)
  final String userId; // Supabase auth user ID
  final String userPhone;
  final String? userName;
  final String hazardType;
  final String description;
  final double latitude;
  final double longitude;
  final bool isHighRisk;
  final int? peopleAtRisk;
  final String? urgencyLevel;
  final String immediateDangerStatus;
  final String? affectedPeopleBand;
  final List<String>? mediaUrls; // Nullable for text-only reports
  final bool uploadComplete; // Track partial uploads
  final String status;
  final DateTime eventTime; // When hazard occurred
  final DateTime createdAt; // When stored in DB

  HazardReport({
    this.id,
    String? clientId,
    required this.userId,
    required this.userPhone,
    this.userName,
    required this.hazardType,
    required this.description,
    required this.latitude,
    required this.longitude,
    this.isHighRisk = false,
    this.peopleAtRisk,
    this.urgencyLevel,
    this.immediateDangerStatus = immediateDangerNo,
    this.affectedPeopleBand,
    this.mediaUrls,
    this.uploadComplete = false,
    this.status = 'pending',
    DateTime? eventTime,
    DateTime? createdAt,
  })  : clientId = clientId ?? const Uuid().v4(),
        eventTime = eventTime ?? DateTime.now(),
        createdAt = createdAt ?? DateTime.now();

  /// Minimal JSON for offline queue persistence.
  ///
  /// This is intentionally different from [toJson] (DB payload) so we can
  /// reconstruct a [HazardReport] object without relying on DB response shape.
  Map<String, dynamic> toQueueJson() {
    return {
      'id': id,
      'clientId': clientId,
      'userId': userId,
      'userPhone': userPhone,
      'userName': userName,
      'hazardType': hazardType,
      'description': description,
      'latitude': latitude,
      'longitude': longitude,
      'isHighRisk': isHighRisk,
      'peopleAtRisk': peopleAtRisk,
      'urgencyLevel': urgencyLevel,
      'immediateDangerStatus': immediateDangerStatus,
      'affectedPeopleBand': affectedPeopleBand,
      'mediaUrls': mediaUrls,
      'uploadComplete': uploadComplete,
      'status': status,
      'eventTime': eventTime.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory HazardReport.fromQueueJson(Map<String, dynamic> json) {
    return HazardReport(
      id: json['id'] as String?,
      clientId: json['clientId'] as String?,
      userId: json['userId'] as String,
      userPhone: json['userPhone'] as String,
      userName: json['userName'] as String?,
      hazardType: json['hazardType'] as String,
      description: json['description'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      isHighRisk: json['isHighRisk'] as bool? ?? false,
      peopleAtRisk: json['peopleAtRisk'] as int?,
      urgencyLevel: json['urgencyLevel'] as String?,
      immediateDangerStatus: json['immediateDangerStatus'] as String? ?? immediateDangerNo,
      affectedPeopleBand: json['affectedPeopleBand'] as String?,
      mediaUrls: json['mediaUrls'] != null ? List<String>.from(json['mediaUrls']) : null,
      uploadComplete: json['uploadComplete'] as bool? ?? false,
      status: json['status'] as String? ?? 'pending',
      eventTime: DateTime.tryParse(json['eventTime'] as String? ?? '') ?? DateTime.now(),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }

  // Convert to JSON for Supabase insert
  Map<String, dynamic> toJson() {
    return {
      'client_id': clientId,
      'user_id': userId,
      'user_phone': userPhone,
      'user_name': userName,
      'hazard_type': hazardType,
      'description': description,
      'location': 'SRID=4326;POINT($longitude $latitude)', // PostGIS format
      'latitude': latitude,
      'longitude': longitude,
      'is_high_risk': isHighRisk,
      'people_at_risk': peopleAtRisk,
      'urgency_level': urgencyLevel,
      'immediate_danger_status': immediateDangerStatus,
      'affected_people_band': affectedPeopleBand,
      'media_urls': mediaUrls,
      'upload_complete': uploadComplete,
      'status': status,
      'event_time': eventTime.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  // Create from Supabase response
  factory HazardReport.fromJson(Map<String, dynamic> json) {
    return HazardReport(
      id: json['id'],
      clientId: json['client_id'],
      userId: json['user_id'],
      userPhone: json['user_phone'],
      userName: json['user_name'],
      hazardType: json['hazard_type'],
      description: json['description'],
      latitude: json['latitude'],
      longitude: json['longitude'],
      isHighRisk: json['is_high_risk'] ?? false,
      peopleAtRisk: json['people_at_risk'],
      urgencyLevel: json['urgency_level'],
      immediateDangerStatus: json['immediate_danger_status'] as String? ?? immediateDangerNo,
      affectedPeopleBand: json['affected_people_band'] as String?,
      mediaUrls: json['media_urls'] != null 
          ? List<String>.from(json['media_urls']) 
          : null,
      uploadComplete: json['upload_complete'] ?? false,
      status: json['status'] ?? 'pending',
      eventTime: DateTime.parse(json['event_time']),
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  /// Create from privacy-safe RPC response.
  ///
  /// This is used for public viewing of VERIFIED reports where RLS prevents
  /// direct SELECT from `hazard_reports`.
  factory HazardReport.fromPublicJson(Map<String, dynamic> json) {
    return HazardReport(
      id: json['id']?.toString(),
      userId: 'public',
      userPhone: '',
      userName: null,
      hazardType: (json['hazard_type'] as String?) ?? 'Unknown',
      description: (json['description'] as String?) ?? '',
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      isHighRisk: json['is_high_risk'] as bool? ?? false,
      urgencyLevel: json['urgency_level'] as String?,
      immediateDangerStatus: json['immediate_danger_status'] as String? ?? immediateDangerNo,
      affectedPeopleBand: json['affected_people_band'] as String?,
      mediaUrls: json['media_urls'] != null ? List<String>.from(json['media_urls'] as List) : null,
      uploadComplete: true,
      status: (json['status'] as String?) ?? 'verified',
      eventTime: DateTime.parse(json['event_time'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  // Copy with modifications
  HazardReport copyWith({
    String? id,
    String? clientId,
    String? userId,
    String? userPhone,
    String? userName,
    String? hazardType,
    String? description,
    double? latitude,
    double? longitude,
    bool? isHighRisk,
    int? peopleAtRisk,
    String? urgencyLevel,
    String? immediateDangerStatus,
    String? affectedPeopleBand,
    List<String>? mediaUrls,
    bool? uploadComplete,
    String? status,
    DateTime? eventTime,
    DateTime? createdAt,
  }) {
    return HazardReport(
      id: id ?? this.id,
      clientId: clientId ?? this.clientId,
      userId: userId ?? this.userId,
      userPhone: userPhone ?? this.userPhone,
      userName: userName ?? this.userName,
      hazardType: hazardType ?? this.hazardType,
      description: description ?? this.description,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isHighRisk: isHighRisk ?? this.isHighRisk,
      peopleAtRisk: peopleAtRisk ?? this.peopleAtRisk,
      urgencyLevel: urgencyLevel ?? this.urgencyLevel,
      immediateDangerStatus: immediateDangerStatus ?? this.immediateDangerStatus,
      affectedPeopleBand: affectedPeopleBand ?? this.affectedPeopleBand,
      mediaUrls: mediaUrls ?? this.mediaUrls,
      uploadComplete: uploadComplete ?? this.uploadComplete,
      status: status ?? this.status,
      eventTime: eventTime ?? this.eventTime,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Convert to map marker with reduced precision for privacy
  MapMarkerData toMapMarker({bool isOwnReport = false}) {
    final LatLng reducedLocation = isOwnReport
        ? LatLng(latitude, longitude)
        : LocationPrivacy.reducePrecision(latitude, longitude);
    return MapMarkerData(
      id: id ?? clientId,
      location: reducedLocation,
      hazardType: hazardType,
      urgencyLevel: urgencyLevel ?? 'Low',
      timestamp: createdAt,
      isHighRisk: isHighRisk,
      isOwnReport: isOwnReport,
    );
  }
}
