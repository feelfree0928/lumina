'use client';

import { useState } from 'react';
import { BirthDetails } from '@/types/profile';
import { Button } from '@/components/ui/Button';

interface BirthDetailsFormProps {
  onChange: (details: BirthDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

async function geocodeCity(
  city: string,
  country: string
): Promise<{ lat: number; lon: number } | null> {
  const query = encodeURIComponent(`${city}, ${country}`);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

const fieldClass =
  'w-full bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-400';

export default function BirthDetailsForm({ onChange, onNext, onBack }: BirthDetailsFormProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour12, setHour12] = useState('');
  const [minute, setMinute] = useState('');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    day && month && year && hour12 && minute !== '' && city.trim() && country.trim();

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const coords = await geocodeCity(city.trim(), country.trim());
      if (!coords) {
        setError('Could not locate that city. Try "City, Country" spelling.');
        setLoading(false);
        return;
      }

      // Convert 12h + meridiem → 24h
      let hour = parseInt(hour12, 10) % 12;
      if (meridiem === 'PM') hour += 12;

      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

      onChange({
        day: parseInt(day, 10),
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        hour,
        minute: parseInt(minute, 10),
        city: city.trim(),
        country: country.trim(),
        latitude: coords.lat,
        longitude: coords.lon,
        timezone,
      });
      onNext();
    } catch {
      setError('Something went wrong resolving your birthplace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-white">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-light">Your birth details</h2>
        <p className="text-white/50 text-sm">Used to map your personal astrology.</p>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-white/40">Date of birth</label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <input className={fieldClass} placeholder="DD" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} />
          <input className={fieldClass} placeholder="MM" inputMode="numeric" value={month} onChange={(e) => setMonth(e.target.value)} />
          <input className={fieldClass} placeholder="YYYY" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-white/40">Time of birth</label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <input className={fieldClass} placeholder="HH" inputMode="numeric" value={hour12} onChange={(e) => setHour12(e.target.value)} />
          <input className={fieldClass} placeholder="MM" inputMode="numeric" value={minute} onChange={(e) => setMinute(e.target.value)} />
          <select
            className={fieldClass}
            value={meridiem}
            onChange={(e) => setMeridiem(e.target.value as 'AM' | 'PM')}
          >
            <option className="bg-slate-900" value="AM">AM</option>
            <option className="bg-slate-900" value="PM">PM</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-white/40">City</label>
          <input className={`${fieldClass} mt-1`} placeholder="New York" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-white/40">Country</label>
          <input className={`${fieldClass} mt-1`} placeholder="US" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-rose-300 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button variant="subtle" className="flex-1" onClick={onBack} type="button">
          ← Back
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={!valid || loading} type="button">
          {loading ? 'Locating…' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
