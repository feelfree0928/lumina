export interface NatalChartResponse {
  sun_sign: string;
  moon_sign: string;
  rising_sign: string;
  planets: Record<
    string,
    {
      sign: string;
      house: number;
      degree: number;
      retrograde: boolean;
    }
  >;
}

export interface DailyTransitResponse {
  date: string;
  transits: Array<{
    planet: string;
    sign: string;
    aspect?: string;
    natal_planet?: string;
    interpretation: string;
  }>;
  overall_theme: string;
}
