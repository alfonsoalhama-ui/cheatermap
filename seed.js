const SUPABASE_URL = 'https://jywhmvvazlgdvnetqvdy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2htdnZhemxnZHZuZXRxdmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDM0ODAsImV4cCI6MjA5NjE3OTQ4MH0.s8g0x5ybRaHMHhrg5oMvBMAHTzcKrEq-lIjxwyvrVsE';

// Distribución realista para una app viral en inglés — mercados desarrollados primero
const cities = [
  { name: 'New York',     weight: 14, region: 'americas' },
  { name: 'Miami',        weight: 11, region: 'americas' },
  { name: 'London',       weight: 10, region: 'europe'   },
  { name: 'São Paulo',    weight:  9, region: 'americas' },
  { name: 'Chicago',      weight:  8, region: 'americas' },
  { name: 'Paris',        weight:  8, region: 'europe'   },
  { name: 'Madrid',       weight:  7, region: 'europe'   },
  { name: 'Buenos Aires', weight:  7, region: 'americas' },
  { name: 'Dubai',        weight:  6, region: 'asia'     },
  { name: 'Barcelona',    weight:  6, region: 'europe'   },
  { name: 'Tokyo',        weight:  5, region: 'asia'     },
  { name: 'Istanbul',     weight:  4, region: 'asia'     },
  { name: 'Sydney',       weight:  4, region: 'asia'     },
  { name: 'Rome',         weight:  3, region: 'europe'   },
  { name: 'Berlin',       weight:  3, region: 'europe'   },
  { name: 'Mexico City',  weight:  3, region: 'americas' },
  { name: 'Mumbai',       weight:  2, region: 'asia'     },
  { name: 'Jakarta',      weight:  2, region: 'asia'     },
  { name: 'Cairo',        weight:  1, region: 'africa'   },
  { name: 'Lagos',        weight:  1, region: 'africa'   },
];

// Distribución mensual con curva de crecimiento realista (~80 → ~250/mes)
const months = [
  { year: 2025, month: 10, count: 148, maxDay: null }, // Nov 2025
  { year: 2025, month: 11, count: 183, maxDay: null }, // Dec 2025
  { year: 2026, month:  0, count: 218, maxDay: null }, // Jan 2026
  { year: 2026, month:  1, count: 252, maxDay: null }, // Feb 2026
  { year: 2026, month:  2, count: 287, maxDay: null }, // Mar 2026
  { year: 2026, month:  3, count: 321, maxDay: null }, // Apr 2026
  { year: 2026, month:  4, count: 354, maxDay: null }, // May 2026
  { year: 2026, month:  5, count: 215, maxDay: 12  }, // Jun 2026 (hasta día 12)
];

const celebrityTypes = ['actor', 'singer', 'athlete', 'influencer', 'model', 'politician'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function pickWeightedCity() {
  const total = cities.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const city of cities) {
    r -= city.weight;
    if (r <= 0) return city;
  }
  return cities[cities.length - 1];
}

function pickDestination(origin) {
  const r = Math.random();
  if (r < 0.85) return origin.name;                                          // 85% misma ciudad
  if (r < 0.95) {                                                             // 10% misma región
    const sameRegion = cities.filter(c => c.region === origin.region && c.name !== origin.name);
    return sameRegion.length ? sameRegion[Math.floor(Math.random() * sameRegion.length)].name : origin.name;
  }
  const other = cities.filter(c => c.region !== origin.region);               //  5% otro país
  return other.length ? other[Math.floor(Math.random() * other.length)].name : origin.name;
}

function pickGender() {
  const r = Math.random();
  if (r < 0.58)  return 'm';
  if (r < 0.95)  return 'f';
  if (r < 0.975) return 'gm';
  return 'gf';
}

function randomDateInMonth(year, month, maxDay) {
  const lastDay = maxDay || new Date(year, month + 1, 0).getDate();
  const weightedDays = [];
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month, d).getDay();
    const weight = (dow === 0 || dow === 6) ? 2 : 1;
    for (let w = 0; w < weight; w++) weightedDays.push(d);
  }
  const day = weightedDays[Math.floor(Math.random() * weightedDays.length)];
  const h   = Math.floor(Math.random() * 24);
  const m   = Math.floor(Math.random() * 60);
  const s   = Math.floor(Math.random() * 60);
  return new Date(Date.UTC(year, month, day, h, m, s)).toISOString();
}

async function insertBatch(records) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer':        'return=minimal'
    },
    body: JSON.stringify(records)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error ${res.status}: ${err}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const allRecords = [];

  for (const { year, month, count, maxDay } of months) {
    const numCelebs = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < numCelebs; i++) {
      const origin = pickWeightedCity();
      allRecords.push({
        created_at:       randomDateInMonth(year, month, maxDay),
        gender:           pickGender(),
        origin_city:      origin.name,
        destination_city: pickDestination(origin),
        is_fake:          null,
        is_celebrity:     true,
        celebrity_type:   celebrityTypes[Math.floor(Math.random() * celebrityTypes.length)],
        confirmed_count:  0,
        is_confirmed:     false
      });
    }

    for (let i = 0; i < count; i++) {
      const origin = pickWeightedCity();
      allRecords.push({
        created_at:       randomDateInMonth(year, month, maxDay),
        gender:           pickGender(),
        origin_city:      origin.name,
        destination_city: pickDestination(origin),
        is_fake:          null,
        is_celebrity:     false,
        celebrity_type:   null,
        confirmed_count:  0,
        is_confirmed:     false
      });
    }
  }

  while (allRecords.length < 2000) {
    const origin = pickWeightedCity();
    allRecords.push({
      created_at:       randomDateInMonth(2026, 4, null),
      gender:           pickGender(),
      origin_city:      origin.name,
      destination_city: pickDestination(origin),
      is_fake:          null,
      is_celebrity:     false,
      celebrity_type:   null,
      confirmed_count:  0,
      is_confirmed:     false
    });
  }

  console.log(`\n📦 Total registros a insertar: ${allRecords.length}`);

  const BATCH = 100;
  let done = 0;
  for (let i = 0; i < allRecords.length; i += BATCH) {
    await insertBatch(allRecords.slice(i, i + BATCH));
    done += Math.min(BATCH, allRecords.length - i);
    process.stdout.write(`\r⏳ Insertados: ${done}/${allRecords.length}`);
  }

  console.log(`\n✅ ¡Listo! ${done} registros insertados en Supabase.`);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
