// GET /api/slots?start=YYYY-MM-DD&end=YYYY-MM-DD
// Returns free 30-minute slots from Cal.com (which reads funding@ Google Calendar), in IST:
// { live: true, slots: { "2026-11-12": [600, 630, ...] } }   (minutes after midnight IST)
// Booked, pending and busy times are simply not returned, so the website never shows them.
import { CAL, enabled, headers, json } from './cal-common.mjs';

const ymd = /^\d{4}-\d{2}-\d{2}$/;

export default async (req) => {
  if (!enabled()) return json(200, { live: false });
  const url = new URL(req.url);
  const start = url.searchParams.get('start'), end = url.searchParams.get('end');
  if (!ymd.test(start || '') || !ymd.test(end || '')) return json(400, { live: false, error: 'bad dates' });

  const q = new URLSearchParams({ username: CAL.username, eventTypeSlug: CAL.eventSlug, start, end, timeZone: CAL.tz });
  try {
    const r = await fetch(`${CAL.api}/slots?${q}`, { headers: headers(CAL.slotsVersion) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.status === 'error') return json(502, { live: false, error: 'calendar unavailable' });
    const out = {};
    for (const [day, list] of Object.entries(data.data || {})) {
      for (const s of list || []) {
        const iso = typeof s === 'string' ? s : s.start || s.time;
        if (!iso) continue;
        const d = new Date(iso);
        const ist = new Date(d.getTime() + 330 * 60000); // shift to IST wall clock
        const key = ist.toISOString().slice(0, 10);
        const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
        (out[key] ||= []).push(mins);
      }
      void day;
    }
    for (const k of Object.keys(out)) out[k] = [...new Set(out[k])].sort((a, b) => a - b);
    return json(200, { live: true, slots: out });
  } catch {
    return json(502, { live: false, error: 'calendar unavailable' });
  }
};

export const config = { path: '/api/slots' };
