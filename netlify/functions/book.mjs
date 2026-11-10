// POST /api/book  (JSON) → creates a booking REQUEST in Cal.com.
// The event type is set to "Requires confirmation": the owner gets Confirm / Reject buttons by email;
// on Confirm, Cal.com adds it to Google Calendar and (for video calls) creates and emails a Google Meet link.
import { CAL, enabled, headers, json } from './cal-common.mjs';

const clean = (v, n = 300) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false });
  if (!enabled()) return json(503, { ok: false, error: 'live booking off' });
  let b;
  try { b = await req.json(); } catch { return json(400, { ok: false, error: 'bad request' }); }
  if (b.website) return json(200, { ok: true }); // honeypot: silently drop bots

  const name = clean(b.name, 80), email = clean(b.email, 120), mobile = clean(b.mobile, 20).replace(/[^\d+]/g, '');
  const mode = b.mode === 'Phone call' ? 'Phone call' : 'Video call';
  const start = new Date(b.start);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !/^\+91[6-9]\d{9}$/.test(mobile) || isNaN(start.getTime()))
    return json(400, { ok: false, error: 'invalid details' });

  const notes = [
    `Topic: ${clean(b.service, 120)}`,
    `Meeting: ${mode}`,
    b.business ? `Business: ${clean(b.business, 120)}` : '',
    b.turnover ? `Turnover: ${clean(b.turnover, 60)}` : '',
    b.amount ? `Funding needed: ${clean(b.amount, 60)}` : '',
    `Mobile: ${mobile}`,
    b.message ? `Message: ${clean(b.message, 1000)}` : '',
    `Source: ${clean(b.source, 120)}`,
  ].filter(Boolean).join('\n');

  const body = {
    start: start.toISOString(),
    username: CAL.username,
    eventTypeSlug: CAL.eventSlug,
    attendee: { name, email, timeZone: CAL.tz, phoneNumber: mobile, language: 'en' },
    location: mode === 'Phone call' ? { type: 'attendeePhone', phone: mobile } : { type: 'integration', integration: 'google-meet' },
    bookingFieldsResponses: { notes },
    metadata: { topic: clean(b.service, 120), mode, mobile, source: clean(b.source, 120) },
  };

  try {
    const r = await fetch(`${CAL.api}/bookings`, { method: 'POST', headers: headers(CAL.bookingsVersion), body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.status !== 'error') {
      const d = Array.isArray(data.data) ? data.data[0] : data.data || {};
      return json(200, { ok: true, uid: d.uid || '', status: d.status || 'pending' });
    }
    const msg = JSON.stringify(data).toLowerCase();
    if (r.status === 409 || /no longer available|not available|already|conflict|booked/.test(msg)) return json(409, { ok: false, error: 'slot taken' });
    console.error('Cal.com booking failed', r.status, JSON.stringify(data).slice(0, 500));
    return json(502, { ok: false, error: 'booking failed' });
  } catch (e) {
    console.error('Cal.com unreachable', e);
    return json(502, { ok: false, error: 'booking failed' });
  }
};

export const config = { path: '/api/book' };
