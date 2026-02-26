import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

class DeviceIdService {
  static const String _key = 'device_id';

  Future<String> getOrCreate() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_key);
    if (existing != null && existing.trim().isNotEmpty) return existing;

    final id = const Uuid().v4();
    await prefs.setString(_key, id);
    return id;
  }
}
