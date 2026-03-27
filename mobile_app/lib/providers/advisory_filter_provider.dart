import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/advisory_category.dart';

/// Sort options for advisories
enum AdvisorySortOption {
  mostRelevant,
  newest,
  nearest,
}

/// Filter state for the Updates/Advisories screen
class AdvisoryFilterState {
  final String? severity; // 'warning', 'watch', 'info', or null for all
  final AdvisoryCategory? category;
  final bool nearMeOnly;
  final bool showExpired;
  final bool hasContactOnly;
  final bool translatedOnly;
  final String regionSearch;
  final AdvisorySortOption sortOption;

  const AdvisoryFilterState({
    this.severity,
    this.category,
    this.nearMeOnly = false,
    this.showExpired = false,
    this.hasContactOnly = false,
    this.translatedOnly = false,
    this.regionSearch = '',
    this.sortOption = AdvisorySortOption.mostRelevant,
  });

  AdvisoryFilterState copyWith({
    String? Function()? severity,
    AdvisoryCategory? Function()? category,
    bool? nearMeOnly,
    bool? showExpired,
    bool? hasContactOnly,
    bool? translatedOnly,
    String? regionSearch,
    AdvisorySortOption? sortOption,
  }) {
    return AdvisoryFilterState(
      severity: severity != null ? severity() : this.severity,
      category: category != null ? category() : this.category,
      nearMeOnly: nearMeOnly ?? this.nearMeOnly,
      showExpired: showExpired ?? this.showExpired,
      hasContactOnly: hasContactOnly ?? this.hasContactOnly,
      translatedOnly: translatedOnly ?? this.translatedOnly,
      regionSearch: regionSearch ?? this.regionSearch,
      sortOption: sortOption ?? this.sortOption,
    );
  }

  /// Returns true if any filter is active (excluding sort)
  bool get hasActiveFilters =>
      severity != null ||
      category != null ||
      nearMeOnly ||
      showExpired ||
      hasContactOnly ||
      translatedOnly ||
      regionSearch.isNotEmpty;

  /// Count of active advanced filters (shown in filter icon badge)
  int get advancedFilterCount {
    int count = 0;
    if (showExpired) count++;
    if (hasContactOnly) count++;
    if (translatedOnly) count++;
    if (regionSearch.isNotEmpty) count++;
    return count;
  }

  /// List of active filter labels for display
  List<ActiveFilter> get activeFilters {
    final filters = <ActiveFilter>[];
    if (severity != null) {
      filters.add(ActiveFilter(type: FilterType.severity, value: severity!));
    }
    if (category != null) {
      filters.add(ActiveFilter(type: FilterType.category, value: category!.name));
    }
    if (nearMeOnly) {
      filters.add(const ActiveFilter(type: FilterType.nearMe, value: 'nearMe'));
    }
    if (showExpired) {
      filters.add(const ActiveFilter(type: FilterType.showExpired, value: 'showExpired'));
    }
    if (hasContactOnly) {
      filters.add(const ActiveFilter(type: FilterType.hasContact, value: 'hasContact'));
    }
    if (translatedOnly) {
      filters.add(const ActiveFilter(type: FilterType.translated, value: 'translated'));
    }
    if (regionSearch.isNotEmpty) {
      filters.add(ActiveFilter(type: FilterType.region, value: regionSearch));
    }
    return filters;
  }

  /// Reset all filters to default
  AdvisoryFilterState reset() {
    return const AdvisoryFilterState();
  }
}

enum FilterType {
  severity,
  category,
  nearMe,
  showExpired,
  hasContact,
  translated,
  region,
}

class ActiveFilter {
  final FilterType type;
  final String value;

  const ActiveFilter({required this.type, required this.value});
}

class AdvisoryFilterNotifier extends Notifier<AdvisoryFilterState> {
  @override
  AdvisoryFilterState build() => const AdvisoryFilterState();

  void setSeverity(String? severity) {
    state = state.copyWith(severity: () => severity);
  }

  void setCategory(AdvisoryCategory? category) {
    state = state.copyWith(category: () => category);
  }

  void toggleNearMe() {
    state = state.copyWith(nearMeOnly: !state.nearMeOnly);
  }

  void setNearMe(bool value) {
    state = state.copyWith(nearMeOnly: value);
  }

  void setShowExpired(bool value) {
    state = state.copyWith(showExpired: value);
  }

  void setHasContactOnly(bool value) {
    state = state.copyWith(hasContactOnly: value);
  }

  void setTranslatedOnly(bool value) {
    state = state.copyWith(translatedOnly: value);
  }

  void setRegionSearch(String value) {
    state = state.copyWith(regionSearch: value);
  }

  void setSortOption(AdvisorySortOption option) {
    state = state.copyWith(sortOption: option);
  }

  void removeFilter(FilterType type) {
    switch (type) {
      case FilterType.severity:
        state = state.copyWith(severity: () => null);
        break;
      case FilterType.category:
        state = state.copyWith(category: () => null);
        break;
      case FilterType.nearMe:
        state = state.copyWith(nearMeOnly: false);
        break;
      case FilterType.showExpired:
        state = state.copyWith(showExpired: false);
        break;
      case FilterType.hasContact:
        state = state.copyWith(hasContactOnly: false);
        break;
      case FilterType.translated:
        state = state.copyWith(translatedOnly: false);
        break;
      case FilterType.region:
        state = state.copyWith(regionSearch: '');
        break;
    }
  }

  void clearAll() {
    state = const AdvisoryFilterState();
  }

  void clearAdvancedFilters() {
    state = state.copyWith(
      showExpired: false,
      hasContactOnly: false,
      translatedOnly: false,
      regionSearch: '',
    );
  }
}

final advisoryFilterProvider =
    NotifierProvider<AdvisoryFilterNotifier, AdvisoryFilterState>(
  AdvisoryFilterNotifier.new,
);
