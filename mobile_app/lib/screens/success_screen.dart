import 'package:flutter/material.dart';
import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import '../widgets/primary_button.dart';
import 'user_details_screen.dart';

class SuccessScreen extends StatelessWidget {
  const SuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Center(
        // Center the card
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min, // Shrink to fit content
              children: [
                // Success Icon with Glow
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.success.withOpacity(
                      0.1,
                    ), // Keep Success green or make sea? User said "buttons... sea color". Keeping Check green usually makes sense for Success, but let's make it Sea for consistent "Sea" theme as requested "sea color NOT the green".
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.secondaryCyan, // Sea Cyan
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x661CA9C9),
                          blurRadius: 15,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(12),
                    child: const Icon(
                      Icons.check,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                Text(
                  context.l10n.signedInSuccessfully,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color:
                        Theme.of(context).textTheme.bodyLarge?.color ??
                        const Color(0xFF1E1E1E),
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 16),

                Text(
                  context.l10n.directingToDashboard,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color:
                        Theme.of(
                          context,
                        ).textTheme.bodyMedium?.color?.withOpacity(0.7) ??
                        const Color(0xFF8E8E93),
                  ),
                ),

                const SizedBox(height: 32),

                SizedBox(
                  width: double.infinity,
                  child: PrimaryButton(
                    text: context.l10n.continueLabel,
                    backgroundColor: AppColors.primaryBlue, // Deep Sea Blue
                    onPressed: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              const UserDetailsScreen(isOnboarding: true),
                        ),
                        (route) => false,
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
