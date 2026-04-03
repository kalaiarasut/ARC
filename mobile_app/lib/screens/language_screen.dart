import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../widgets/primary_button.dart';
import '../providers/language_provider.dart';
import '../l10n/l10n.dart';
import 'login_screen.dart';

class LanguageScreen extends ConsumerStatefulWidget {
  final bool fromSettings;

  const LanguageScreen({super.key, this.fromSettings = false});

  @override
  ConsumerState<LanguageScreen> createState() => _LanguageScreenState();
}

class _LanguageScreenState extends ConsumerState<LanguageScreen> {
  final List<LanguageItem> _languages = [
    LanguageItem(
      name: "Hindi",
      nativeName: "हिन्दी",
      character: "अ",
      color: const Color(0xFFE3F2FD), // Light Blue
      code: "hi",
    ),
    LanguageItem(
      name: "English",
      nativeName: "English",
      character: "A",
      color: const Color(0xFFE8F5E9), // Light Green
      code: "en",
    ),
    LanguageItem(
      name: "Bengali",
      nativeName: "বাংলা",
      character: "আ",
      color: const Color(0xFFE0F2F1), // Teal-ish
      code: "bn",
    ),
    LanguageItem(
      name: "Marathi",
      nativeName: "मराठी",
      character: "आ",
      color: const Color(0xFFFFEBEE), // Light Red/Pink
      code: "mr",
    ),
    LanguageItem(
      name: "Telugu",
      nativeName: "తెలుగు",
      character: "అ",
      color: const Color(0xFFFFF8E1), // Light Yellow
      code: "te",
    ),
    LanguageItem(
      name: "Tamil",
      nativeName: "தமிழ்",
      character: "அ",
      color: const Color(0xFFE0F7FA), // Light Cyan
      code: "ta",
    ),
    LanguageItem(
      name: "Malayalam",
      nativeName: "മലയാളം",
      character: "അ",
      color: const Color(0xFFEFEBE9), // Light Brown/Grey
      code: "ml",
    ),
    LanguageItem(
      name: "Kannada",
      nativeName: "ಕನ್ನಡ",
      character: "ಅ",
      color: const Color(0xFFF3E5F5), // Light Purple
      code: "kn",
    ),
    LanguageItem(
      name: "Gujarati",
      nativeName: "ગુજરાતી",
      character: "અ",
      color: const Color(0xFFFFF3E0), // Light Orange
      code: "gu",
    ),
    LanguageItem(
      name: "Odia",
      nativeName: "ଓଡିଆ",
      character: "ଓ",
      color: const Color(0xFFFCE4EC), // Light Pink
      code: "or",
    ),
  ];

  static const Set<String> _supportedCodes = {
    'bn',
    'en',
    'gu',
    'hi',
    'kn',
    'ml',
    'mr',
    'or',
    'ta',
    'te',
  };

  String _selectedCode = 'en';

  @override
  void initState() {
    super.initState();
    // Initialize selection from persisted provider.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final code = ref.read(languageCodeProvider);
      if (!mounted) return;
      setState(() => _selectedCode = code);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: widget.fromSettings ? kToolbarHeight : 0,
        leading: widget.fromSettings
            ? IconButton(
                icon: Icon(
                  Icons.arrow_back_ios,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkTextPrimary
                      : AppColors.textPrimary,
                ),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        title: widget.fromSettings
            ? Text(
                context.l10n.language,
                style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkTextPrimary
                      : AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                ),
              )
            : null,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 24.0,
                vertical: 16,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    context.l10n.chooseLanguage,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextPrimary
                          : Colors.black,
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 8,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.4, // Slight rectangle
                ),
                itemCount: _languages.length,
                itemBuilder: (context, index) {
                  final item = _languages[index];
                  final isSelected = item.code == _selectedCode;
                  final isSupported = _supportedCodes.contains(item.code);

                  return GestureDetector(
                    onTap: () {
                      if (!isSupported) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(context.l10n.languageComingSoon),
                          ),
                        );
                        return;
                      }
                      setState(() => _selectedCode = item.code);
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSupported
                            ? item.color
                            : item.color.withOpacity(0.35),
                        borderRadius: BorderRadius.circular(12),
                        border: isSelected
                            ? Border.all(color: AppColors.primaryBlue, width: 3)
                            : null,
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            top: 12,
                            left: 12,
                            child: Text(
                              "${item.name}${item.name != item.nativeName ? '-${item.nativeName}' : ''}",
                              style: TextStyle(
                                fontSize: 12, // Small text as requested
                                color: Colors.grey[800],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          Center(
                            child: Text(
                              item.character,
                              style: TextStyle(
                                fontSize: 60, // Big character
                                fontWeight: FontWeight.bold,
                                color: _getCharacterColor(
                                  isSupported
                                      ? item.color
                                      : item.color.withOpacity(0.35),
                                ),
                              ),
                            ),
                          ),
                          if (isSelected)
                            const Positioned(
                              top: 8,
                              right: 8,
                              child: Icon(
                                Icons.check_circle,
                                color: AppColors.primaryBlue,
                                size: 24,
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            Container(
              padding: const EdgeInsets.all(24),
              child: PrimaryButton(
                text: widget.fromSettings
                    ? context.l10n.save
                    : context.l10n.continueLabel,
                onPressed: () async {
                  if (!_supportedCodes.contains(_selectedCode)) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(context.l10n.languageComingSoon)),
                    );
                    return;
                  }

                  await ref
                      .read(languageCodeProvider.notifier)
                      .setLanguageCode(_selectedCode);
                  if (!context.mounted) return;
                  if (widget.fromSettings) {
                    Navigator.pop(context);
                  } else {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Helper to darken the character color based on background
  Color _getCharacterColor(Color background) {
    final hsl = HSLColor.fromColor(background);
    // Darken and saturate slightly for the text color to match the style (e.g. blue bg -> blue text)
    return hsl.withLightness(hsl.lightness - 0.4).withSaturation(0.8).toColor();
  }
}

class LanguageItem {
  final String name;
  final String nativeName;
  final String character;
  final Color color;
  final String code;

  LanguageItem({
    required this.name,
    required this.nativeName,
    required this.character,
    required this.color,
    required this.code,
  });
}
