import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import '../widgets/primary_button.dart';
import 'home_screen.dart';

class UserDetailsScreen extends StatefulWidget {
  final bool isOnboarding;

  const UserDetailsScreen({super.key, required this.isOnboarding});

  @override
  State<UserDetailsScreen> createState() => _UserDetailsScreenState();
}

class _UserDetailsScreenState extends State<UserDetailsScreen> {
  final TextEditingController _nameController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _prefillName();
  }

  Future<void> _prefillName() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('user_name');
    if (!mounted) return;
    if (name != null && name.trim().isNotEmpty) {
      _nameController.text = name.trim();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _saveName() async {
    final name = _nameController.text.trim();
    
    if (name.isEmpty || name.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.pleaseEnterValidName)),
      );
      return;
    }

    setState(() => _isLoading = true);

    // Save to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_name', name);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (widget.isOnboarding) {
      await prefs.setBool('onboarding_complete', true); // Mark onboarding as done
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (route) => false, // Clear all previous routes
      );
      return;
    }

    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isOnboarding) {
      return Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back_ios, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            context.l10n.whatsYourName,
            style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary, fontWeight: FontWeight.bold),
          ),
        ),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.l10n.personalizeExperience,
                style: TextStyle(fontSize: 14, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  hintText: context.l10n.enterYourName,
                  prefixIcon: Icon(Icons.person, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                  filled: true,
                  fillColor: Theme.of(context).cardColor,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primaryBlue, width: 2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: PrimaryButton(
                  text: _isLoading ? context.l10n.savingLabel : context.l10n.save,
                  backgroundColor: AppColors.primaryBlue,
                  onPressed: _isLoading ? () {} : _saveName,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF1E1E1E), // Dark background
      body: Stack(
        children: [
          // Back Button
          Positioned(
            top: 50,
            left: 16,
            child: CircleAvatar(
              backgroundColor: Theme.of(context).cardColor.withOpacity(0.2),
              child: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
          
          // Bottom Card
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(32),
                  topRight: Radius.circular(32),
                ),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Profile Icon
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.secondaryCyan.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: const Icon(
                        Icons.person_outline,
                        size: 40,
                        color: AppColors.primaryBlue,
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    Text(
                      context.l10n.whatsYourName,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      context.l10n.personalizeExperience,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    // Name Input Field
                    TextField(
                      controller: _nameController,
                      textCapitalization: TextCapitalization.words,
                      decoration: InputDecoration(
                        hintText: context.l10n.enterYourName,
                        prefixIcon: Icon(Icons.person, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                        filled: true,
                        fillColor: Theme.of(context).scaffoldBackgroundColor,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.primaryBlue, width: 2),
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Continue Button
                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        text: _isLoading
                            ? context.l10n.savingLabel
                            : context.l10n.continueLabel,
                        backgroundColor: AppColors.primaryBlue,
                        onPressed: _isLoading ? () {} : _saveName,
                      ),
                    ),
                    
                    const SizedBox(height: 16),
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
