const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CITIES = [
  { name: 'New York',     lat:  40.7128, lng:  -74.0060, weight: 14, region: 'americas' },
  { name: 'Miami',        lat:  25.7617, lng:  -80.1918, weight: 11, region: 'americas' },
  { name: 'London',       lat:  51.5074, lng:   -0.1278, weight: 10, region: 'europe'   },
  { name: 'São Paulo',    lat: -23.5505, lng:  -46.6333, weight:  9, region: 'americas' },
  { name: 'Chicago',      lat:  41.8781, lng:  -87.6298, weight:  8, region: 'americas' },
  { name: 'Paris',        lat:  48.8566, lng:    2.3522, weight:  8, region: 'europe'   },
  { name: 'Madrid',       lat:  40.4168, lng:   -3.7038, weight:  7, region: 'europe'   },
  { name: 'Buenos Aires', lat: -34.6037, lng:  -58.3816, weight:  7, region: 'americas' },
  { name: 'Dubai',        lat:  25.2048, lng:   55.2708, weight:  6, region: 'asia'     },
  { name: 'Barcelona',    lat:  41.3851, lng:    2.1734, weight:  6, region: 'europe'   },
  { name: 'Tokyo',        lat:  35.6762, lng:  139.6503, weight:  5, region: 'asia'     },
  { name: 'Istanbul',     lat:  41.0082, lng:   28.9784, weight:  4, region: 'asia'     },
  { name: 'Sydney',       lat: -33.8688, lng:  151.2093, weight:  4, region: 'asia'     },
  { name: 'Rome',         lat:  41.9028, lng:   12.4964, weight:  3, region: 'europe'   },
  { name: 'Berlin',       lat:  52.5200, lng:   13.4050, weight:  3, region: 'europe'   },
  { name: 'Mexico City',  lat:  19.4326, lng:  -99.1332, weight:  3, region: 'americas' },
  { name: 'Mumbai',       lat:  19.0760, lng:   72.8777, weight:  2, region: 'asia'     },
  { name: 'Jakarta',      lat:  -6.2088, lng:  106.8456, weight:  2, region: 'asia'     },
  { name: 'Cairo',        lat:  30.0444, lng:   31.2357, weight:  1, region: 'africa'   },
  { name: 'Lagos',        lat:   6.5244, lng:    3.3792, weight:  1, region: 'africa'   },
];

type City = typeof CITIES[0];

function wRnd(arr: City[]): City {
  const total = arr.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of arr) { r -= c.weight; if (r <= 0) return c; }
  return arr[arr.length - 1];
}

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickDestination(origin: City): City {
  const r = Math.random();
  if (r < 0.85) return origin;
  if (r < 0.95) {
    const nearby = CITIES.filter(c => c.region === origin.region && c.name !== origin.name);
    return nearby.length ? rnd(nearby) : origin;
  }
  return wRnd(CITIES);
}

function pickGender(): string {
  const r = Math.random();
  if (r < 0.58)  return 'm';
  if (r < 0.95)  return 'f';
  if (r < 0.975) return 'gm';
  return 'gf';
}

const PROFESSIONS = [
  { name: 'Doctor/Nurse',            w: 12 },
  { name: 'Sales Representative',    w: 10 },
  { name: 'Tradesperson',            w:  9 },
  { name: 'Teacher/Educator',        w:  8 },
  { name: 'Hospitality Worker',      w:  7 },
  { name: 'Executive/CEO',           w:  6 },
  { name: 'Police/Military',         w:  5 },
  { name: 'Lawyer',                  w:  4 },
  { name: 'Pilot/Flight Attendant',  w:  4 },
  { name: 'Finance/Banker',          w:  4 },
  { name: 'IT/Developer',            w:  3 },
  { name: 'Journalist/Media',        w:  3 },
  { name: 'ER Doctor/Surgeon',       w:  3 },
  { name: 'Shop Owner/Retailer',     w:  3 },
  { name: 'Driver/Transport Worker', w:  3 },
  { name: 'Athlete/Personal Trainer',w:  2 },
  { name: 'Actor/Musician/DJ',       w:  2 },
  { name: 'Real Estate Agent',       w:  2 },
  { name: 'HR Professional',         w:  2 },
  { name: 'Architect/Engineer',      w:  2 },
  { name: 'Pharmacist',              w:  1 },
  { name: 'Psychologist/Therapist',  w:  1 },
  { name: 'Chef/Cook',               w:  1 },
  { name: 'Hairdresser/Beautician',  w:  1 },
  { name: 'Freelancer/Self-employed',w:  1 },
];

function pickProfession(): string {
  const total = PROFESSIONS.reduce((s, p) => s + p.w, 0);
  let r = Math.random() * total;
  for (const p of PROFESSIONS) { r -= p.w; if (r <= 0) return p.name; }
  return PROFESSIONS[PROFESSIONS.length - 1].name;
}

const H: Record<string, string> = {
  apikey:        SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

Deno.serve(async (_req) => {
  // 1. Read config
  const cfgRes = await fetch(
    `${SUPABASE_URL}/rest/v1/config?id=eq.1&select=ficticia_enabled,ficticia_interval_minutes`,
    { headers: H }
  );
  const [cfg] = await cfgRes.json() as Array<{ ficticia_enabled: boolean; ficticia_interval_minutes: number }>;

  if (!cfg?.ficticia_enabled) {
    return new Response(JSON.stringify({ status: 'disabled' }), { headers: { 'Content-Type': 'application/json' } });
  }

  // 2. Check time since last record
  const lastRes = await fetch(
    `${SUPABASE_URL}/rest/v1/reports?select=created_at&order=created_at.desc&limit=1`,
    { headers: H }
  );
  const [last] = await lastRes.json() as Array<{ created_at: string }>;

  if (last) {
    const elapsedMin = (Date.now() - new Date(last.created_at).getTime()) / 60000;
    if (elapsedMin < cfg.ficticia_interval_minutes) {
      return new Response(
        JSON.stringify({ status: 'too_soon', elapsed_min: +elapsedMin.toFixed(1) }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 3. Generate and insert ficticia
  const origin     = wRnd(CITIES);
  const dest       = pickDestination(origin);
  const gender     = pickGender();
  const profession = pickProfession();

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: 'POST',
    headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({
      gender, profession,
      origin_city:      origin.name,
      destination_city: dest.name,
      is_fake:          true,
      is_celebrity:     false,
      confirmed_count:  0,
      is_confirmed:     false,
      created_at:       new Date().toISOString(),
      origin_lat:       origin.lat,
      origin_lng:       origin.lng,
      dest_lat:         dest.lat,
      dest_lng:         dest.lng,
    }),
  });

  if (!insertRes.ok) {
    const err = await insertRes.text();
    return new Response(JSON.stringify({ status: 'error', error: err }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ status: 'ok', origin: origin.name, dest: dest.name, gender }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
