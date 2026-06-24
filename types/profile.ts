export type ReligiousTradition =
  | 'christianity'
  | 'islam'
  | 'judaism'
  | 'hinduism'
  | 'buddhism'
  | 'sikhism'
  | 'spiritual_nonreligious'
  | 'agnostic'
  | 'other';

export type MoodLabel =
  | 'joyful'
  | 'calm'
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'tired'
  | 'neutral'
  | 'unknown';

export interface BirthDetails {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  city: string; // e.g. "New York"
  country: string; // e.g. "US"
  latitude: number;
  longitude: number;
  timezone: string; // e.g. "America/New_York"
}

export interface UserProfile {
  id: string; // uuid generated client-side
  name: string;
  birthDetails: BirthDetails;
  religion: ReligiousTradition;
  customAffirmations: string[]; // Pre-programmed uplift messages
  createdAt: string; // ISO date string
}
