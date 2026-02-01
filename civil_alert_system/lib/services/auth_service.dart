import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_config.dart';

class AuthService {
  final SupabaseClient _supabase = SupabaseConfig.client;

  // Send OTP to phone number
  Future<void> sendOTP(String phoneNumber) async {
    try {
      // Ensure phone number has country code
      final formattedPhone = phoneNumber.startsWith('+') 
          ? phoneNumber 
          : '+91$phoneNumber';

      await _supabase.auth.signInWithOtp(
        phone: formattedPhone,
      );
    } catch (e) {
      throw Exception('Failed to send OTP: ${e.toString()}');
    }
  }

  // Verify OTP
  Future<AuthResponse> verifyOTP({
    required String phoneNumber,
    required String otp,
  }) async {
    try {
      final formattedPhone = phoneNumber.startsWith('+') 
          ? phoneNumber 
          : '+91$phoneNumber';

      final response = await _supabase.auth.verifyOTP(
        phone: formattedPhone,
        token: otp,
        type: OtpType.sms,
      );

      return response;
    } catch (e) {
      throw Exception('Failed to verify OTP: ${e.toString()}');
    }
  }

  // Get current user
  User? getCurrentUser() {
    return _supabase.auth.currentUser;
  }

  // Sign out
  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }

  // Listen to auth state changes
  Stream<AuthState> get authStateChanges {
    return _supabase.auth.onAuthStateChange;
  }
}
