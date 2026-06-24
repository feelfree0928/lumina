// Uses astrologyapi.com — register at https://astrologyapi.com
// API base: https://json.astrologyapi.com/v1

import { BirthDetails } from '@/types/profile';
import { NatalChartResponse, DailyTransitResponse } from '@/types/astrology';
import { env } from '@/lib/env';

const ASTRO_BASE = 'https://json.astrologyapi.com/v1';

function getAuthHeader(): string {
  const credentials = Buffer.from(
    `${env.astrology.userId}:${env.astrology.apiKey}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

function birthDetailsToPayload(b: BirthDetails) {
  return {
    day: b.day,
    month: b.month,
    year: b.year,
    hour: b.hour,
    min: b.minute,
    lat: b.latitude,
    lon: b.longitude,
    tzone: getTimezoneOffset(b.timezone),
  };
}

function getTimezoneOffset(timezone: string): number {
  // Returns UTC offset as a float (e.g. -5 for EST, 5.5 for IST)
  try {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / 3600000;
  } catch {
    return 0;
  }
}

export async function getNatalChart(birthDetails: BirthDetails): Promise<NatalChartResponse> {
  const response = await fetch(`${ASTRO_BASE}/planets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(birthDetailsToPayload(birthDetails)),
  });

  if (!response.ok) {
    throw new Error(`AstrologyAPI planets error: ${response.status}`);
  }

  const data = await response.json();

  // Normalise to our NatalChartResponse type
  const planets: Record<string, NatalChartResponse['planets'][string]> = {};
  for (const planet of data) {
    planets[String(planet.name).toLowerCase()] = {
      sign: planet.sign,
      house: planet.house,
      degree: planet.fullDegree,
      retrograde: planet.isRetro === 'true',
    };
  }

  return {
    sun_sign: planets['sun']?.sign || 'Unknown',
    moon_sign: planets['moon']?.sign || 'Unknown',
    rising_sign: planets['ascendant']?.sign || 'Unknown',
    planets,
  };
}

export async function getDailyInsight(birthDetails: BirthDetails): Promise<DailyTransitResponse> {
  const today = new Date();

  try {
    const response = await fetch(`${ASTRO_BASE}/current_planets_transit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(birthDetailsToPayload(birthDetails)),
    });

    if (!response.ok) {
      return fallbackInsight(today);
    }

    const data = await response.json();

    // Map to our DailyTransitResponse. The transit endpoint shape varies; be defensive.
    const rawList = Array.isArray(data) ? data : data?.transit_relation || data?.transits || [];
    const list = (Array.isArray(rawList) ? rawList : []) as Array<Record<string, unknown>>;

    const str = (...vals: unknown[]): string | undefined => {
      const found = vals.find((v) => typeof v === 'string' && v.length > 0);
      return found as string | undefined;
    };

    const transits = list.slice(0, 5).map((item) => ({
      planet: str(item.planet_name, item.name, item.planet) || 'A planet',
      sign: str(item.sign, item.transit_sign) || '—',
      aspect: str(item.aspect, item.type),
      natal_planet: str(item.natal_planet, item.natal),
      interpretation:
        str(item.effect, item.interpretation, item.description) || 'Influence active today.',
    }));

    return {
      date: today.toISOString().split('T')[0],
      transits,
      overall_theme: buildThemeSummary(transits),
    };
  } catch {
    // Graceful fallback — never crash the session over astrology
    return fallbackInsight(today);
  }
}

function fallbackInsight(today: Date): DailyTransitResponse {
  return {
    date: today.toISOString().split('T')[0],
    transits: [],
    overall_theme: 'Today is a day for presence and gentle self-reflection.',
  };
}

function buildThemeSummary(transits: DailyTransitResponse['transits']): string {
  if (transits.length === 0) return 'Today invites stillness and inner listening.';
  const first = transits[0];
  return `${first.planet} in ${first.sign} sets today's tone — ${first.interpretation}`;
}
