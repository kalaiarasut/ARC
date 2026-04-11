import type { MarineConditionsPayload, Scope } from '../types/marine.types';

const availableScopes: Scope[] = [
  { id: 'st-chennai', name: 'Chennai Port', type: 'port', state: 'Tamil Nadu' },
  { id: 'st-kakinada', name: 'Kakinada Station', type: 'station', state: 'Andhra Pradesh' },
  { id: 'z-puri', name: 'Puri Coast Zone', type: 'zone', state: 'Odisha' },
];

const buildDailyForecast = (entries: Array<[string, string, number, number, string, 'clear' | 'clouds' | 'rain' | 'night']>) =>
  entries.map(([dayLabel, date, highTemp, lowTemp, weatherLabel, icon]) => ({
    dayLabel,
    date,
    highTemp,
    lowTemp,
    weatherLabel,
    icon,
  }));

const datasetByScope: Record<string, Omit<MarineConditionsPayload, 'availableScopes' | 'selectedScope'>> = {
  'st-chennai': {
    dataFreshness: 'live',
    lastUpdatedTime: new Date().toISOString(),
    currentWeather: {
      label: 'Partly Cloudy',
      temperature: 31,
      feelsLike: 35,
      humidity: 74,
      pressure: 1006,
      windSpeed: 19,
      windDirection: 'SE',
      rainChance: 28,
      cloudCover: 42,
      trendText: 'Warm and humid conditions continue into the evening with moderate coastal winds.',
      icon: 'clouds',
    },
    currentTide: {
      currentStatus: 'rising',
      currentLevel: 1.4,
      nextHighTime: '21:20',
      nextLowTime: '03:10',
      trendIndicator: 'Flood tide building through sunset.',
      tomorrowPreview: 'Tomorrow morning high tide expected around 09:05.',
    },
    currentWave: {
      significantHeight: 1.7,
      swellHeight: 2.1,
      direction: 'SSE',
      period: 8,
      seaStateLabel: 'Moderate',
      impactNote: 'Moderate surf along exposed coastal stretches through tonight.',
      trendText: 'Wave energy remains steady with a slight build after dusk.',
    },
    hourlyForecast: [
      { time: 'Now', temp: 31, icon: 'clouds' },
      { time: '01 PM', temp: 32, icon: 'clouds' },
      { time: '02 PM', temp: 32, icon: 'clear' },
      { time: '03 PM', temp: 31, icon: 'clouds' },
      { time: '04 PM', temp: 30, icon: 'rain' },
      { time: '05 PM', temp: 29, icon: 'rain' },
    ],
    dailyForecast: buildDailyForecast([
      ['Tomorrow', '10 Apr', 32, 27, 'Humid', 'clouds'],
      ['Friday', '11 Apr', 33, 27, 'Cloudy', 'clouds'],
      ['Saturday', '12 Apr', 31, 26, 'Rain', 'rain'],
      ['Sunday', '13 Apr', 30, 26, 'Showers', 'rain'],
      ['Monday', '14 Apr', 32, 27, 'Clear', 'clear'],
      ['Tuesday', '15 Apr', 33, 27, 'Clear', 'clear'],
      ['Wednesday', '16 Apr', 32, 26, 'Cloudy', 'clouds'],
    ]),
    alerts: [
      {
        id: 'chennai-advisory',
        severity: 'advisory',
        type: 'Small Craft Advisory',
        authority: 'INCOIS / IMD',
        affectedArea: 'Chennai coast and adjacent nearshore waters',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        summary: 'Moderate sea state with elevated surf expected; small craft should exercise caution.',
      },
    ],
    sources: [
      {
        id: 'src-imd',
        name: 'IMD Coastal Bulletin',
        lastUpdated: new Date().toISOString(),
        isDerived: false,
        attribution: 'Source: India Meteorological Department',
      },
      {
        id: 'src-incois',
        name: 'INCOIS Ocean State Forecast',
        lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        isDerived: false,
        attribution: 'Source: INCOIS ocean forecast products',
      },
    ],
  },
  'st-kakinada': {
    dataFreshness: 'recent',
    lastUpdatedTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    currentWeather: {
      label: 'Mostly Clear',
      temperature: 29,
      feelsLike: 32,
      humidity: 68,
      pressure: 1009,
      windSpeed: 14,
      windDirection: 'E',
      rainChance: 12,
      cloudCover: 20,
      trendText: 'Calmer winds and stable marine conditions through the late evening.',
      icon: 'clear',
    },
    currentTide: {
      currentStatus: 'falling',
      currentLevel: 0.9,
      nextHighTime: '22:45',
      nextLowTime: '16:30',
      trendIndicator: 'Ebb tide continuing through late afternoon.',
      tomorrowPreview: 'Next morning high tide expected around 10:40.',
    },
    currentWave: {
      significantHeight: 1.1,
      swellHeight: 1.4,
      direction: 'ESE',
      period: 7,
      seaStateLabel: 'Slight',
      impactNote: 'Low marine impact expected for harbor approaches.',
      trendText: 'Sea state remains slight with minor evening variation.',
    },
    hourlyForecast: [
      { time: 'Now', temp: 29, icon: 'clear' },
      { time: '01 PM', temp: 30, icon: 'clear' },
      { time: '02 PM', temp: 30, icon: 'clear' },
      { time: '03 PM', temp: 29, icon: 'clouds' },
      { time: '04 PM', temp: 28, icon: 'clouds' },
      { time: '05 PM', temp: 27, icon: 'night' },
    ],
    dailyForecast: buildDailyForecast([
      ['Tomorrow', '10 Apr', 31, 25, 'Clear', 'clear'],
      ['Friday', '11 Apr', 31, 25, 'Clear', 'clear'],
      ['Saturday', '12 Apr', 30, 25, 'Partly Cloudy', 'clouds'],
      ['Sunday', '13 Apr', 30, 24, 'Partly Cloudy', 'clouds'],
      ['Monday', '14 Apr', 29, 24, 'Cloudy', 'clouds'],
      ['Tuesday', '15 Apr', 30, 25, 'Clear', 'clear'],
      ['Wednesday', '16 Apr', 31, 25, 'Clear', 'clear'],
    ]),
    alerts: [],
    sources: [
      {
        id: 'src-imd-kakinada',
        name: 'IMD Marine Forecast',
        lastUpdated: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        isDerived: false,
        attribution: 'Source: India Meteorological Department',
      },
      {
        id: 'src-incois-kakinada',
        name: 'INCOIS Location Specific Forecast',
        lastUpdated: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        isDerived: false,
        attribution: 'Source: INCOIS marine guidance',
      },
    ],
  },
  'z-puri': {
    dataFreshness: 'delayed',
    lastUpdatedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    currentWeather: {
      label: 'Cloudy',
      temperature: 28,
      feelsLike: 31,
      humidity: 82,
      pressure: 1004,
      windSpeed: 24,
      windDirection: 'SW',
      rainChance: 61,
      cloudCover: 78,
      trendText: 'Cloudy and unsettled conditions with stronger onshore winds later today.',
      icon: 'rain',
    },
    currentTide: null,
    currentWave: {
      significantHeight: 2.3,
      swellHeight: null,
      direction: 'SSW',
      period: 10,
      seaStateLabel: 'Rough',
      impactNote: 'Higher surf likely along exposed beaches and zone perimeters.',
      trendText: 'Wave heights are elevated and remain above normal through the night.',
    },
    hourlyForecast: [
      { time: 'Now', temp: 28, icon: 'rain' },
      { time: '01 PM', temp: 28, icon: 'rain' },
      { time: '02 PM', temp: 27, icon: 'rain' },
      { time: '03 PM', temp: 27, icon: 'clouds' },
      { time: '04 PM', temp: 26, icon: 'rain' },
      { time: '05 PM', temp: 26, icon: 'rain' },
    ],
    dailyForecast: buildDailyForecast([
      ['Tomorrow', '10 Apr', 29, 25, 'Rain', 'rain'],
      ['Friday', '11 Apr', 29, 25, 'Storm Risk', 'rain'],
      ['Saturday', '12 Apr', 28, 24, 'Cloudy', 'clouds'],
      ['Sunday', '13 Apr', 29, 24, 'Cloudy', 'clouds'],
      ['Monday', '14 Apr', 30, 25, 'Clear', 'clear'],
      ['Tuesday', '15 Apr', 30, 25, 'Clear', 'clear'],
      ['Wednesday', '16 Apr', 29, 24, 'Cloudy', 'clouds'],
    ]),
    alerts: [
      {
        id: 'puri-warning',
        severity: 'warning',
        type: 'High Wave Warning',
        authority: 'INCOIS',
        affectedArea: 'Puri coastal monitoring zone',
        validFrom: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        validUntil: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
        summary: 'Elevated wave conditions may impact beach approaches and low-lying coastal margins.',
      },
    ],
    sources: [
      {
        id: 'src-incois-puri',
        name: 'INCOIS Ocean State Forecast',
        lastUpdated: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        isDerived: false,
        attribution: 'Source: INCOIS ocean forecast products',
      },
      {
        id: 'src-zone-derived',
        name: 'Zone-normalized marine summary',
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isDerived: true,
        attribution: 'Derived from latest available marine forecast inputs',
        fallbackUsed: true,
      },
    ],
  },
};

export const defaultMarineScopeId = availableScopes[0].id;

export const getMockMarineConditionsPayload = (scopeId = defaultMarineScopeId): MarineConditionsPayload => {
  const selectedScope = availableScopes.find((scope) => scope.id === scopeId) ?? availableScopes[0];
  const payload = datasetByScope[selectedScope.id] ?? datasetByScope[defaultMarineScopeId];

  return {
    ...payload,
    selectedScope,
    availableScopes,
  };
};

export const mockMarineData = getMockMarineConditionsPayload();
