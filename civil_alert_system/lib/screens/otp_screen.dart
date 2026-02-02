import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import '../theme/app_colors.dart';
import '../widgets/primary_button.dart';
import 'success_screen.dart';

class OtpScreen extends StatefulWidget {
  final String mobileNumber;

  const OtpScreen({super.key, required this.mobileNumber});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final TextEditingController _otpController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _otpController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final defaultPinTheme = PinTheme(
      width: 50,
      height: 50,
      textStyle: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: Color(0xFF1E1E1E),
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(50), // Circular inputs
        border: Border.all(color: const Color(0xFFE0E0E0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, 2),
            blurRadius: 4,
          ),
        ],
      ),
    );

    final focusedPinTheme = defaultPinTheme.copyDecorationWith(
      border: Border.all(color: AppColors.primaryBlue, width: 2), // Sea Blue focus
    );

    return Scaffold(
      backgroundColor: const Color(0xFF1E1E1E), // Dark background to simulate overlay
      body: Stack(
        children: [
          // Back Button at top
          Positioned(
            top: 50,
            left: 16,
            child: CircleAvatar(
              backgroundColor: Colors.white.withOpacity(0.2),
              child: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
          
          // Bottom Drawer Content
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(32),
                  topRight: Radius.circular(32),
                ),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Icon
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.secondaryCyan.withOpacity(0.1), // Light Cyan bg
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: const Icon(
                        Icons.lock_person, // Lock icon
                        size: 40,
                        color: AppColors.primaryBlue, // Sea Blue
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    const Text(
                      "Enter OTP",
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E1E1E),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "Sent to ${widget.mobileNumber}",
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF8E8E93),
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    Pinput(
                      length: 6,
                      controller: _otpController,
                      focusNode: _focusNode,
                      defaultPinTheme: defaultPinTheme,
                      focusedPinTheme: focusedPinTheme,
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      onCompleted: (pin) {
                        // Optional: Auto submit
                      },
                    ),
                    
                    const SizedBox(height: 32),
                    
                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        text: "Continue",
                        backgroundColor: AppColors.primaryBlue, // Deep Sea Blue
                        onPressed: () async {
                          final otp = _otpController.text.trim();
                          
                          if (otp.length != 6) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please enter 6-digit OTP')),
                            );
                            return;
                          }
                          
                          // Navigate to Success Screen
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(builder: (_) => const SuccessScreen()),
                          );
                        },
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Didn't receive OTP? ",
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF8E8E93)
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('OTP resent successfully')),
                            );
                          },
                          child: const Text(
                            "Resend (00:30)", // Added hypothetical timer for visual match
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.secondaryCyan, // Cyan
                              fontWeight: FontWeight.bold
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16), // Bottom safe area spacing
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
