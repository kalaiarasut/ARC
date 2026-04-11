export interface Scope {
  id: string;
  name: string;
  type: 'station' | 'zone' | 'port';
  state: string;
}

export interface WeatherCondition {
  label: string;
  temperature: number;
  feelsLike?: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: string;
  rainChance: number;
  cloudCover?: number;
  trendText: string;
  icon: 'clear' | 'clouds' | 'rain' | 'night';
}

export interface TideSummary {
  currentStatus: 'rising' | 'falling' | 'slack';
  currentLevel: number | null;
  nextHighTime: string | null;
  nextLowTime: string | null;
  trendIndicator: string;
  tomorrowPreview?: string;
}

export interface WaveSummary {
  significantHeight: number | null;
  swellHeight?: number | null;
  direction: string | null;
  period: number | null;
  seaStateLabel: string;
  impactNote?: string;
  trendText: string;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  icon: 'clear' | 'clouds' | 'rain' | 'night';
}

export interface DailyForecast {
  dayLabel: string;
  date: string;
  highTemp: number;
  lowTemp: number;
  weatherLabel: string;
  icon: 'clear' | 'clouds' | 'rain' | 'night';
}

export interface OfficialAlert {
  id: string;
  severity: 'informational' | 'advisory' | 'warning' | 'severe';
  type: string;
  authority: string;
  affectedArea: string;
  validFrom: string;
  validUntil: string;
  summary: string;
  link?: string;
}

export interface DataSourceMetadata {
  id: string;
  name: string;
  lastUpdated: string;
  isDerived: boolean;
  attribution: string;
  fallbackUsed?: boolean;
}

export interface MarineConditionsPayload {
  selectedScope: Scope;
  availableScopes: Scope[];
  dataFreshness: 'live' | 'recent' | 'delayed' | 'stale';
  lastUpdatedTime: string;
  currentWeather: WeatherCondition;
  currentTide: TideSummary | null;
  currentWave: WaveSummary | null;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  alerts: OfficialAlert[];
  sources: DataSourceMetadata[];
}
