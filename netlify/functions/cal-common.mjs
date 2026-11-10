// Shared helpers for the Cal.com connector (server side only; the API key never reaches the browser).
// Settings that can change live in src/data/settings.json → booking.cal (editable in /admin/).
import settings from '../../src/data/settings.json';

export const CAL = {
  api: 'https://api.cal.com/v2',
  key: process.env.CAL_API_KEY || '',
  username: settings.booking?.cal?.username || '',
  eventSlug: settings.booking?.cal?.eventSlug || '',
  slotsVersion: process.env.CAL_SLOTS_VERSION || '2024-09-04',
  bookingsVersion: process.env.CAL_BOOKINGS_VERSION || '2024-08-13',
  tz: 'Asia/Kolkata',
};

export const enabled = () => Boolean(settings.booking?.cal?.enabled && CAL.username && CAL.eventSlug && CAL.key);

export function headers(version) {
  const h = { 'cal-api-version': version, 'Content-Type': 'application/json' };
  if (CAL.key) h.Authorization = `Bearer ${CAL.key}`;
  return h;
}

export const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
