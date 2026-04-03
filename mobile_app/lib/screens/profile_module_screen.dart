import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import 'user_details_screen.dart';

class ProfileModuleScreen extends StatefulWidget {
  const ProfileModuleScreen({super.key});

  @override
  State<ProfileModuleScreen> createState() => _ProfileModuleScreenState();
}

class _ProfileModuleScreenState extends State<ProfileModuleScreen> {
  String? _photoPath;
  String? _name;
  String? _phone;

  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;

    setState(() {
      _name = prefs.getString('user_name');
      _phone = prefs.getString('user_phone');
      _photoPath = prefs.getString('profile_photo_path');
    });
  }

  Future<void> _setPhotoFromXFile(XFile picked) async {
    final docs = await getApplicationDocumentsDirectory();
    final profileDir = Directory(p.join(docs.path, 'profile'));
    if (!await profileDir.exists()) {
      await profileDir.create(recursive: true);
    }

    final ext = p.extension(picked.path).isNotEmpty
        ? p.extension(picked.path)
        : '.jpg';
    final fileName = 'profile_${DateTime.now().millisecondsSinceEpoch}$ext';
    final destPath = p.join(profileDir.path, fileName);

    await File(picked.path).copy(destPath);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('profile_photo_path', destPath);
    if (!mounted) return;
    setState(() => _photoPath = destPath);
  }

  Future<void> _removePhoto() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('profile_photo_path');
    if (!mounted) return;
    setState(() => _photoPath = null);
  }

  Future<void> _showPhotoActions() async {
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(
                  Icons.camera_alt_outlined,
                  color: AppColors.primaryBlue,
                ),
                title: Text(context.l10n.camera),
                onTap: () async {
                  Navigator.pop(sheetContext);
                  try {
                    final picked = await _imagePicker.pickImage(
                      source: ImageSource.camera,
                      imageQuality: 90,
                    );
                    if (picked == null) return;
                    await _setPhotoFromXFile(picked);
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          context.l10n.failedToTakePhoto(e.toString()),
                        ),
                      ),
                    );
                  }
                },
              ),
              ListTile(
                leading: const Icon(
                  Icons.photo_library_outlined,
                  color: AppColors.primaryBlue,
                ),
                title: Text(context.l10n.chooseFromGallery),
                onTap: () async {
                  Navigator.pop(sheetContext);
                  try {
                    final picked = await _imagePicker.pickImage(
                      source: ImageSource.gallery,
                      imageQuality: 90,
                    );
                    if (picked == null) return;
                    await _setPhotoFromXFile(picked);
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          context.l10n.failedToPickPhoto(e.toString()),
                        ),
                      ),
                    );
                  }
                },
              ),
              if (_photoPath != null)
                ListTile(
                  leading: const Icon(
                    Icons.delete_outline,
                    color: AppColors.error,
                  ),
                  title: Text(
                    context.l10n.remove,
                    style: const TextStyle(color: AppColors.error),
                  ),
                  onTap: () async {
                    Navigator.pop(sheetContext);
                    await _removePhoto();
                  },
                ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final displayName = (_name == null || _name!.trim().isEmpty)
        ? context.l10n.user
        : _name!.trim();
    final phone = _phone?.trim();

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios,
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextPrimary
                : AppColors.textPrimary,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.profile,
          style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextPrimary
                : AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: _showPhotoActions,
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: AppColors.primaryBlue,
                          backgroundImage:
                              (_photoPath != null &&
                                  File(_photoPath!).existsSync())
                              ? FileImage(File(_photoPath!))
                              : null,
                          child:
                              (_photoPath == null ||
                                  !File(_photoPath!).existsSync())
                              ? const Icon(Icons.person, color: Colors.white)
                              : null,
                        ),
                        Positioned(
                          right: -2,
                          bottom: -2,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Theme.of(context).cardColor,
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(
                                color: AppColors.greyOutline.withOpacity(0.7),
                              ),
                            ),
                            child: const Icon(
                              Icons.edit,
                              size: 14,
                              color: AppColors.primaryBlue,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          (phone == null || phone.isEmpty)
                              ? context.l10n.phoneNotSet
                              : phone,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color:
                                Theme.of(context).brightness == Brightness.dark
                                ? AppColors.darkTextSecondary
                                : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              const UserDetailsScreen(isOnboarding: false),
                        ),
                      );
                      await _loadProfile();
                    },
                    child: Text(context.l10n.edit),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
