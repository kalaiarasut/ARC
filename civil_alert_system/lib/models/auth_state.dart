class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;
  final String? userId;
  final String? phoneNumber;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
    this.userId,
    this.phoneNumber,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    String? userId,
    String? phoneNumber,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      userId: userId ?? this.userId,
      phoneNumber: phoneNumber ?? this.phoneNumber,
    );
  }
}
