/// Official advisory category
/// food | shelter | medical | rescue | roadblock | warning | evacuation
enum AdvisoryCategory {
  food,
  shelter,
  medical,
  rescue,
  roadblock,
  warning,
  evacuation,
  unknown,
}

AdvisoryCategory advisoryCategoryFromString(String? value) {
  switch ((value ?? '').toLowerCase()) {
    case 'food':
      return AdvisoryCategory.food;
    case 'shelter':
      return AdvisoryCategory.shelter;
    case 'medical':
      return AdvisoryCategory.medical;
    case 'rescue':
      return AdvisoryCategory.rescue;
    case 'roadblock':
      return AdvisoryCategory.roadblock;
    case 'warning':
      return AdvisoryCategory.warning;
    case 'evacuation':
      return AdvisoryCategory.evacuation;
    default:
      return AdvisoryCategory.unknown;
  }
}

String advisoryCategoryLabel(AdvisoryCategory category) {
  switch (category) {
    case AdvisoryCategory.food:
      return 'Food';
    case AdvisoryCategory.shelter:
      return 'Shelter';
    case AdvisoryCategory.medical:
      return 'Medical';
    case AdvisoryCategory.rescue:
      return 'Rescue';
    case AdvisoryCategory.roadblock:
      return 'Roadblock';
    case AdvisoryCategory.warning:
      return 'Warning';
    case AdvisoryCategory.evacuation:
      return 'Evacuation';
    case AdvisoryCategory.unknown:
      return 'Update';
  }
}
