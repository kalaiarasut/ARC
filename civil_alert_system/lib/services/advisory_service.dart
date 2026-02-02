import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/supabase_config.dart';
import '../models/official_advisory.dart';

class AdvisoryService {
  final SupabaseClient _supabase = SupabaseConfig.client;

  Future<List<OfficialAdvisory>> getLatest({int limit = 30}) async {
    final response = await _supabase
        .from('official_advisories')
        .select()
        .order('published_at', ascending: false)
        .limit(limit);

    return (response as List)
        .map((json) => OfficialAdvisory.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
