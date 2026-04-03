import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../l10n/l10n.dart';
import '../models/advisory_category.dart';
import '../providers/advisory_filter_provider.dart';
import '../theme/app_colors.dart';

/// Sticky filter row component with Severity, Category, Near me, Sort, and Filter icon
class AdvisoryFilterBar extends ConsumerWidget {
  final VoidCallback onFilterTap;

  const AdvisoryFilterBar({super.key, required this.onFilterTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filterState = ref.watch(advisoryFilterProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        border: Border(
          bottom: BorderSide(
            color: isDark
                ? AppColors.darkOutline.withOpacity(0.3)
                : AppColors.greyOutline.withOpacity(0.5),
          ),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            // Severity dropdown
            _SeverityDropdown(
              selectedSeverity: filterState.severity,
              onSelected: (s) => ref.read(advisoryFilterProvider.notifier).setSeverity(s),
            ),
            const SizedBox(width: 8),
            // Category dropdown
            _CategoryDropdown(
              selectedCategory: filterState.category,
              onSelected: (c) => ref.read(advisoryFilterProvider.notifier).setCategory(c),
            ),
            const SizedBox(width: 8),
            // Near me toggle
            _NearMeChip(
              isActive: filterState.nearMeOnly,
              onTap: () => ref.read(advisoryFilterProvider.notifier).toggleNearMe(),
            ),
            const SizedBox(width: 8),
            // Sort dropdown
            _SortDropdown(
              selectedSort: filterState.sortOption,
              onSelected: (s) => ref.read(advisoryFilterProvider.notifier).setSortOption(s),
            ),
            const SizedBox(width: 8),
            // Filter icon button
            _FilterIconButton(
              badgeCount: filterState.advancedFilterCount,
              onTap: onFilterTap,
            ),
          ],
        ),
      ),
    );
  }
}

/// Severity dropdown chip
class _SeverityDropdown extends StatelessWidget {
  final String? selectedSeverity;
  final ValueChanged<String?> onSelected;

  const _SeverityDropdown({
    required this.selectedSeverity,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedSeverity != null;
    final languageCode = Localizations.localeOf(context).languageCode;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    String getLabel() {
      if (selectedSeverity == null) return context.l10n.filterSeverity;
      return advisorySeverityLabelForLanguage(selectedSeverity!, languageCode);
    }

    Color getSeverityDotColor(String severity) {
      switch (severity) {
        case 'warning':
          return AppColors.error;
        case 'watch':
          return AppColors.warning;
        default:
          return isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue;
      }
    }

    return PopupMenuButton<String?>(
      onSelected: onSelected,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkCard : Colors.white,
      itemBuilder: (ctx) => [
        PopupMenuItem(
          value: null,
          child: Row(
            children: [
              if (selectedSeverity == null) ...[
                Icon(Icons.check, size: 18, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue),
                const SizedBox(width: 8),
              ] else
                const SizedBox(width: 26),
              Text(context.l10n.filterAllSeverities),
            ],
          ),
        ),
        for (final sev in ['warning', 'watch', 'info'])
          PopupMenuItem(
            value: sev,
            child: Row(
              children: [
                if (selectedSeverity == sev) ...[
                  Icon(Icons.check, size: 18, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue),
                  const SizedBox(width: 8),
                ] else
                  const SizedBox(width: 26),
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: getSeverityDotColor(sev),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(advisorySeverityLabelForLanguage(sev, languageCode)),
              ],
            ),
          ),
      ],
      child: _DropdownChip(
        label: getLabel(),
        isSelected: hasSelection,
        severityColor: hasSelection ? getSeverityDotColor(selectedSeverity!) : null,
      ),
    );
  }
}

/// Category dropdown chip
class _CategoryDropdown extends StatelessWidget {
  final AdvisoryCategory? selectedCategory;
  final ValueChanged<AdvisoryCategory?> onSelected;

  const _CategoryDropdown({
    required this.selectedCategory,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedCategory != null;
    final languageCode = Localizations.localeOf(context).languageCode;

    String getLabel() {
      if (selectedCategory == null) return context.l10n.filterCategory;
      return advisoryCategoryLabelForLanguage(selectedCategory!, languageCode);
    }

    final categories = AdvisoryCategory.values.where((c) => c != AdvisoryCategory.unknown).toList();

    return PopupMenuButton<AdvisoryCategory?>(
      onSelected: onSelected,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkCard : Colors.white,
      constraints: const BoxConstraints(maxHeight: 350),
      itemBuilder: (ctx) => [
        PopupMenuItem(
          value: null,
          child: Row(
            children: [
              if (selectedCategory == null) ...[
                Icon(Icons.check, size: 18, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue),
                const SizedBox(width: 8),
              ] else
                const SizedBox(width: 26),
              Text(context.l10n.filterAllCategories),
            ],
          ),
        ),
        for (final cat in categories)
          PopupMenuItem(
            value: cat,
            child: Row(
              children: [
                if (selectedCategory == cat) ...[
                  Icon(Icons.check, size: 18, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue),
                  const SizedBox(width: 8),
                ] else
                  const SizedBox(width: 26),
                Text(advisoryCategoryLabelForLanguage(cat, languageCode)),
              ],
            ),
          ),
      ],
      child: _DropdownChip(
        label: getLabel(),
        isSelected: hasSelection,
      ),
    );
  }
}

/// Near me toggle chip
class _NearMeChip extends StatelessWidget {
  final bool isActive;
  final VoidCallback onTap;

  const _NearMeChip({required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selectedColor =
        isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue;
    final unselectedText =
        isDark ? AppColors.darkTextSecondary : AppColors.textSecondary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? selectedColor : (isDark ? AppColors.darkCard : Colors.white),
            borderRadius: BorderRadius.circular(20),
            border: isActive ? null : Border.all(color: Colors.transparent),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.near_me_rounded,
                size: 14,
                color: isActive ? Colors.white : unselectedText,
              ),
              const SizedBox(width: 6),
              Text(
                context.l10n.filterNearMe,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                  color: isActive ? Colors.white : unselectedText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Sort dropdown
class _SortDropdown extends StatelessWidget {
  final AdvisorySortOption selectedSort;
  final ValueChanged<AdvisorySortOption> onSelected;

  const _SortDropdown({
    required this.selectedSort,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    String getSortLabel(AdvisorySortOption option) {
      switch (option) {
        case AdvisorySortOption.mostRelevant:
          return context.l10n.sortMostRelevant;
        case AdvisorySortOption.newest:
          return context.l10n.sortNewest;
        case AdvisorySortOption.nearest:
          return context.l10n.sortNearest;
      }
    }

    return PopupMenuButton<AdvisorySortOption>(
      onSelected: onSelected,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: isDark ? AppColors.darkCard : Colors.white,
      itemBuilder: (ctx) => [
        for (final option in AdvisorySortOption.values)
          PopupMenuItem(
            value: option,
            child: Row(
              children: [
                if (selectedSort == option) ...[
                  Icon(Icons.check, size: 18, color: isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue),
                  const SizedBox(width: 8),
                ] else
                  const SizedBox(width: 26),
                Text(getSortLabel(option)),
              ],
            ),
          ),
      ],
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              getSortLabel(selectedSort),
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
            ),
            const SizedBox(width: 2),
            Icon(
              Icons.keyboard_arrow_down,
              size: 16,
              color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}

/// Filter icon button with badge
class _FilterIconButton extends StatelessWidget {
  final int badgeCount;
  final VoidCallback onTap;

  const _FilterIconButton({required this.badgeCount, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isDark ? AppColors.darkOutline : AppColors.greyOutline),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(
                Icons.tune,
                size: 20,
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
              if (badgeCount > 0)
                Positioned(
                  top: 4,
                  right: 4,
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '$badgeCount',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Dropdown chip appearance (used by Severity and Category)
class _DropdownChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final Color? severityColor;

  const _DropdownChip({
    required this.label,
    required this.isSelected,
    this.severityColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selectedColor =
        isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue;
    final unselectedText =
        isDark ? AppColors.darkTextSecondary : AppColors.textSecondary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isSelected ? selectedColor : (isDark ? AppColors.darkCard : Colors.white),
        borderRadius: BorderRadius.circular(20),
        border: isSelected ? null : Border.all(color: Colors.transparent),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              color: isSelected ? Colors.white : unselectedText,
            ),
          ),
          const SizedBox(width: 4),
          Icon(
            Icons.keyboard_arrow_down,
            size: 18,
            color: isSelected ? Colors.white : unselectedText,
          ),
        ],
      ),
    );
  }
}

/// Active filters row with removable chips
class ActiveFiltersRow extends ConsumerWidget {
  const ActiveFiltersRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filterState = ref.watch(advisoryFilterProvider);
    final activeFilters = filterState.activeFilters
        .where(
          (filter) =>
              filter.type != FilterType.severity &&
              filter.type != FilterType.category &&
              filter.type != FilterType.nearMe,
        )
        .toList();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final languageCode = Localizations.localeOf(context).languageCode;

    if (activeFilters.isEmpty) return const SizedBox.shrink();

    String getFilterLabel(ActiveFilter filter) {
      switch (filter.type) {
        case FilterType.severity:
          return advisorySeverityLabelForLanguage(filter.value, languageCode);
        case FilterType.category:
          final cat = advisoryCategoryFromString(filter.value);
          return advisoryCategoryLabelForLanguage(cat, languageCode);
        case FilterType.nearMe:
          return context.l10n.filterNearMe;
        case FilterType.showExpired:
          return context.l10n.filterIncludeExpired;
        case FilterType.hasContact:
          return context.l10n.filterHasContact;
        case FilterType.translated:
          return context.l10n.filterTranslatedOnly;
        case FilterType.region:
          return '"${filter.value}"';
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (final filter in activeFilters) ...[
              _RemovableFilterChip(
                label: getFilterLabel(filter),
                onRemove: () => ref.read(advisoryFilterProvider.notifier).removeFilter(filter.type),
              ),
              const SizedBox(width: 8),
            ],
            // Clear all button
            if (activeFilters.length > 1)
              InkWell(
                onTap: () => ref.read(advisoryFilterProvider.notifier).clearAll(),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  child: Text(
                    context.l10n.filterClearAll,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Removable filter chip
class _RemovableFilterChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;

  const _RemovableFilterChip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue;

    return Container(
      padding: const EdgeInsets.only(left: 10, top: 4, bottom: 4, right: 4),
      decoration: BoxDecoration(
        color: primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primaryColor.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: primaryColor,
            ),
          ),
          const SizedBox(width: 4),
          InkWell(
            onTap: onRemove,
            borderRadius: BorderRadius.circular(999),
            child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.close, size: 12, color: primaryColor),
            ),
          ),
        ],
      ),
    );
  }
}

/// Filter bottom sheet
class AdvisoryFilterBottomSheet extends ConsumerStatefulWidget {
  const AdvisoryFilterBottomSheet({super.key});

  @override
  ConsumerState<AdvisoryFilterBottomSheet> createState() => _AdvisoryFilterBottomSheetState();
}

class _AdvisoryFilterBottomSheetState extends ConsumerState<AdvisoryFilterBottomSheet> {
  late TextEditingController _regionController;
  late bool _showExpired;
  late bool _hasContactOnly;
  late bool _translatedOnly;

  @override
  void initState() {
    super.initState();
    final state = ref.read(advisoryFilterProvider);
    _regionController = TextEditingController(text: state.regionSearch);
    _showExpired = state.showExpired;
    _hasContactOnly = state.hasContactOnly;
    _translatedOnly = state.translatedOnly;
  }

  @override
  void dispose() {
    _regionController.dispose();
    super.dispose();
  }

  void _applyFilters() {
    final notifier = ref.read(advisoryFilterProvider.notifier);
    notifier.setRegionSearch(_regionController.text.trim());
    notifier.setShowExpired(_showExpired);
    notifier.setHasContactOnly(_hasContactOnly);
    notifier.setTranslatedOnly(_translatedOnly);
    Navigator.pop(context);
  }

  void _clearAll() {
    setState(() {
      _regionController.clear();
      _showExpired = false;
      _hasContactOnly = false;
      _translatedOnly = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkOutline : AppColors.greyOutline,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                context.l10n.filtersLabel,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
              ),
              TextButton(
                onPressed: _clearAll,
                child: Text(
                  context.l10n.filterClearAll,
                  style: TextStyle(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Region search
          Text(
            context.l10n.filterSearchByRegion,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _regionController,
            decoration: InputDecoration(
              hintText: context.l10n.filterSearchRegion,
              prefixIcon: Icon(
                Icons.search,
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
              filled: true,
              fillColor: isDark ? AppColors.darkCard : Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: isDark ? AppColors.darkOutline : AppColors.greyOutline),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: isDark ? AppColors.darkOutline : AppColors.greyOutline),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue,
                  width: 2,
                ),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
          const SizedBox(height: 20),

          // Status section
          Text(
            context.l10n.filterStatus,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _ChoiceChipCustom(
                label: context.l10n.filterActiveOnly,
                isSelected: !_showExpired,
                onTap: () => setState(() => _showExpired = false),
              ),
              _ChoiceChipCustom(
                label: context.l10n.filterIncludeExpired,
                isSelected: _showExpired,
                onTap: () => setState(() => _showExpired = true),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Additional filters
          Text(
            context.l10n.filterAdditional,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ChoiceChipCustom(
                label: context.l10n.filterHasContact,
                isSelected: _hasContactOnly,
                onTap: () => setState(() => _hasContactOnly = !_hasContactOnly),
              ),
              _ChoiceChipCustom(
                label: context.l10n.filterTranslatedOnly,
                isSelected: _translatedOnly,
                onTap: () => setState(() => _translatedOnly = !_translatedOnly),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Apply button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _applyFilters,
              style: ElevatedButton.styleFrom(
                backgroundColor: isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                context.l10n.filterApply,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
          SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 8),
        ],
      ),
    );
  }
}

/// Custom choice chip for bottom sheet
class _ChoiceChipCustom extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ChoiceChipCustom({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? primaryColor : (isDark ? AppColors.darkCard : Colors.white),
            borderRadius: BorderRadius.circular(20),
            border: isSelected
                ? null
                : Border.all(color: isDark ? AppColors.darkOutline : AppColors.greyOutline),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              color: isSelected
                  ? Colors.white
                  : (isDark ? AppColors.darkTextPrimary : AppColors.textPrimary),
            ),
          ),
        ),
      ),
    );
  }
}

/// Show filter bottom sheet
void showAdvisoryFilterBottomSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => const AdvisoryFilterBottomSheet(),
  );
}
