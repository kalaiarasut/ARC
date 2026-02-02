import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../theme/app_colors.dart';
import 'language_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  final List<OnboardingItem> _items = [
    OnboardingItem(
      title: "Your Trusted Collaborator\nin Times of Disaster",
      description: "Get real-time alerts and contribute to safety by reporting ocean hazards as they happen.",
      // Using reliable Unsplash ID for Storm/Ocean
      image: "https://images.unsplash.com/photo-1498354136128-58f7901945a9?q=80&w=800&auto=format&fit=crop", 
    ),
    OnboardingItem(
      title: "Empowering Safety,\nOne Step at a Time",
      description: "Join a network of vigilant eyes on the sea, sharing real-time hazard information to save lives.",
      // Unsplash ID for Rescue/Safety
      image: "https://images.unsplash.com/photo-1558486012-81714731dca9?q=80&w=800&auto=format&fit=crop",
    ),
    OnboardingItem(
      title: "Preparedness at\nYour Fingertips",
      description: "Report ocean hazards, receive crucial alerts, and stay informed before it's too late.",
      // Unsplash ID for Calm Ocean/Tech
      image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=800&auto=format&fit=crop",
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // 1. Full Screen Background Images with PageView
          Positioned.fill(
            child: PageView.builder(
              controller: _pageController,
              itemCount: _items.length,
              onPageChanged: (index) {
                setState(() => _currentIndex = index);
              },
              itemBuilder: (context, index) {
                return Image.network(
                  _items[index].image,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      color: AppColors.primaryBlue.withOpacity(0.1),
                      child: const Center(
                         child: CircularProgressIndicator(),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                     return Container(
                      color: AppColors.primaryBlue.withOpacity(0.2),
                      child: const Center(child: Icon(Icons.image_not_supported, size: 50, color: Colors.white)),
                    );
                  },
                );
              },
            ),
          ),
          
          // 2. Curved Bottom Sheet Overlay
          Align(
            alignment: Alignment.bottomCenter,
            child: ClipPath(
              clipper: TopCurveClipper(),
              child: Container(
                height: MediaQuery.of(context).size.height * 0.45,
                width: double.infinity,
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(24, 60, 24, 24), // Top padding for curve
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Expanded(
                      child: Column(
                        children: [
                           Text(
                            _items[_currentIndex].title,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF1E1E1E),
                              height: 1.2,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _items[_currentIndex].description,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF666666),
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {
                          if (_currentIndex < _items.length - 1) {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                          } else {
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(builder: (_) => const LanguageScreen()),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryBlue, // Sea Theme
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        child: const Text(
                          "Continue",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Indicators
                    SmoothPageIndicator(
                      controller: _pageController,
                      count: _items.length,
                      effect: const ExpandingDotsEffect(
                        activeDotColor: AppColors.secondaryCyan, // Sea Cyan
                        dotColor: Color(0xFFE0E0E0),
                        dotHeight: 6,
                        dotWidth: 6,
                        expansionFactor: 4,
                        spacing: 8,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Skip Button Top Right (Overlay)
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            right: 20,
            child: TextButton(
              onPressed: () {
                 Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LanguageScreen()),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  "Skip",
                  style: TextStyle(
                    color: Colors.white, 
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class TopCurveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    // Start at bottom left
    path.lineTo(0, size.height);
    // Line to bottom right
    path.lineTo(size.width, size.height);
    // Line up to top right (lower than top-left to create angle if needed, or straight)
    path.lineTo(size.width, 50);
    
    // Quadratic bezier curve to top left
    // Control point at center, slightly UP (-20) or DOWN to create the "smile" or "hill"
    // Reference looks like a "Smile" (concave top) or "Hill" (convex top)? 
    // Image 1: White shape is "U" like.
    // Let's do a subtle Convex curve (Hill) which is safer and standard. 
    // Wait, looking at the image: The white part dips DOWN in the middle. It is Concave.
    
    path.quadraticBezierTo(size.width / 2, -30, 0, 50);
    
    path.close();
    return path;
    
    // Actually, let's just do a clean "Hill" curve which is easier to make look good? 
    // The reference actually looks like a CONVEX curve (Hill) - wait, looking at "Onboard..." image again.
    // The IMAGE is circular at the bottom. The WHITE is circular at the top.
    // So the white container should bow UPWARDS in the middle? No, the image bows downwards.
    // So the white container should be a "Valley" (Concave).
    // Let's try Concave.
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}

class OnboardingItem {
  final String title;
  final String description;
  final String image;

  OnboardingItem({
    required this.title,
    required this.description,
    required this.image,
  });
}
