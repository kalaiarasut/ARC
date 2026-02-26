import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/auth_state.dart';
import '../services/auth_service.dart';

// Auth service provider
final authServiceProvider = Provider<AuthService>((ref) => AuthService());

// Auth state provider
final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _checkAuthStatus();
    return const AuthState();
  }

  AuthService get _authService => ref.read(authServiceProvider);

  // Check if user is already authenticated
  Future<void> _checkAuthStatus() async {
    final user = _authService.getCurrentUser();
    if (user != null) {
      state = state.copyWith(
        isAuthenticated: true,
        userId: user.id,
        phoneNumber: user.phone,
      );
    }
  }

  // Send OTP to phone number
  Future<void> sendOTP(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      await _authService.sendOTP(phoneNumber);
      state = state.copyWith(
        isLoading: false,
        phoneNumber: phoneNumber,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  // Verify OTP
  Future<void> verifyOTP({
    required String phoneNumber,
    required String otp,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final response = await _authService.verifyOTP(
        phoneNumber: phoneNumber,
        otp: otp,
      );

      if (response.user != null) {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          userId: response.user!.id,
          phoneNumber: response.user!.phone,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  // Sign out
  Future<void> signOut() async {
    await _authService.signOut();
    state = const AuthState();
  }

  // Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}
