import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../widgets/primary_button.dart';
import '../widgets/custom_text_field.dart';
import '../services/auth_service.dart';
import 'otp_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _mobileController = TextEditingController();
  final AuthService _authService = AuthService();
  bool _isSending = false;

  @override
  void dispose() {
    _mobileController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Log in / Sign up"),
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Sign up with your registered mobile number",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "We will send you an OTP to verify your number",
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 32),
              
              const Text(
                "Mobile number *",
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              CustomTextField(
                hintText: "12345 67890",
                controller: _mobileController,
                keyboardType: TextInputType.phone,
                prefixText: "+91",
                onChanged: (_) => setState(() {}),
              ),
              
              const Spacer(),
              
              
              PrimaryButton(
                text: _isSending ? "Sending..." : "Send OTP",
                onPressed: (_mobileController.text.length >= 10 && !_isSending)
                    ? () async {
                        final raw = _mobileController.text.trim();
                        final phone = "+91$raw";

                        setState(() => _isSending = true);
                        try {
                          await _authService.sendOTP(phone);
                          if (!context.mounted) return;

                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => OtpScreen(mobileNumber: phone)),
                          );
                        } catch (e) {
                          if (!context.mounted) return;

                          final message = (e is AuthApiException)
                              ? e.message
                              : e.toString();

                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Failed to send OTP.\n'
                                '$message\n\n'
                                'Check Supabase: Authentication → Providers → Phone (enabled) and SMS provider configured (Twilio).',
                              ),
                            ),
                          );
                        } finally {
                          if (mounted) setState(() => _isSending = false);
                        }
                      }
                    : () {},
                backgroundColor: _mobileController.text.length >= 10 
                    ? AppColors.primaryBlue 
                    : AppColors.greyOutline,
                textColor: _mobileController.text.length >= 10 
                    ? Colors.white 
                    : AppColors.textSecondary,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
