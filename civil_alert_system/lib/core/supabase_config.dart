import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  // TODO: Replace with your actual Supabase credentials
  // Get these from: https://app.supabase.com/project/_/settings/api
  static const String supabaseUrl = 'https://zaimfwpaloadjrljgdzd.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaW1md3BhbG9hZGpybGpnZHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDgwNTQsImV4cCI6MjA4NTMyNDA1NH0.en3NwTc64eLy633LLLl4kMRfycvDPJKEUDZUo7cxg6Y';

  static SupabaseClient get client => Supabase.instance.client;

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
  }
}
