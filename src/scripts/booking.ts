// Booking flow for /book/.
// At launch, bookings are sent as requests through Netlify Forms (form name "booking")
// and emailed to the site owner. To switch to a live Cal.com calendar later, replace
// buildDates/buildTimes with Cal.com's slots API and submitBooking with its bookings API.

type Svc = { id: string; title: string; note: string; docs: string[] };
type Cfg = { services: Svc[]; booking: { openHour: number; closeHour: number; slotMinutes: number; daysAhead: number; minNoticeHours: number; openDays: number[]; blockedDates: string[]; modes: string[] }; brand: string; email: string; baseDocs: string[] };

const cfg: Cfg = JSON.parse(document.getElementById('booking-data')!.textContent || '{}');
const form = document.querySelector<HTMLFormElement>('[data-booking]')!;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = form) => root.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = form) => Array.from(root.querySelectorAll<T>(sel));

const IST_OFFSET = 330; // minutes
const state = { step: 1, service: '', mode: '', date: '', time: -1 };

// ---------- time helpers (all booking times are India Standard Time) ----------
function nowIST(): Date { const n = new Date(); return new Date(n.getTime() + (IST_OFFSET + n.getTimezoneOffset()) * 60000); }
function ymd(d: Date) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function parseYmd(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12, 0, 0); }
function longDate(s: string) { return parseYmd(s).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
function timeLabel(mins: number) { const h = Math.floor(mins / 60), m = mins % 60; const h12 = h % 12 || 12; return `${h12}:${m === 0 ? '00' : String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`; }
function utcStamp(dateStr: string, mins: number) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const t = Date.UTC(y, mo - 1, d, 0, 0, 0) + (mins - IST_OFFSET) * 60000;
  return new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function slotsFor(dateStr: string) {
  const b = cfg.booking, out: { mins: number; ok: boolean }[] = [];
  const now = nowIST();
  const isToday = dateStr === ymd(now);
  const earliest = now.getHours() * 60 + now.getMinutes() + b.minNoticeHours * 60;
  for (let m = b.openHour * 60; m + b.slotMinutes <= b.closeHour * 60; m += b.slotMinutes) {
    out.push({ mins: m, ok: !isToday || m >= earliest });
  }
  return out;
}

function buildDates() {
  const box = $('[data-dates]');
  const b = cfg.booking;
  const start = nowIST(); start.setHours(12, 0, 0, 0);
  const dows = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  box.innerHTML = '';
  for (let i = 0; i < b.daysAhead; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const key = ymd(d);
    const closed = !b.openDays.includes(d.getDay()) || b.blockedDates.includes(key) || !slotsFor(key).some((s) => s.ok);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'opt-btn date-btn'; btn.dataset.value = key;
    btn.disabled = closed;
    btn.setAttribute('aria-pressed', String(state.date === key));
    btn.setAttribute('aria-label', d.toDateString() + (closed ? ', unavailable' : ''));
    btn.innerHTML = `<span class="dow">${i === 0 ? 'TODAY' : dows[d.getDay()]}</span><span class="day">${d.getDate()}</span><span class="mon">${closed ? 'Closed' : d.toLocaleDateString('en-IN', { month: 'short' })}</span>`;
    btn.addEventListener('click', () => { state.date = key; state.time = -1; clearErr('step'); buildDates(); });
    box.appendChild(btn);
  }
}

function buildTimes() {
  const box = $('[data-times]');
  $('[data-date-label]').textContent = state.date ? `${longDate(state.date)} · all times IST · 30 minutes` : '';
  box.innerHTML = '';
  slotsFor(state.date).forEach((s) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'opt-btn time-btn'; btn.disabled = !s.ok;
    btn.textContent = timeLabel(s.mins);
    btn.setAttribute('aria-pressed', String(state.time === s.mins));
    btn.addEventListener('click', () => { state.time = s.mins; clearErr('step'); buildTimes(); });
    box.appendChild(btn);
  });
}

// ---------- step rendering ----------
function render() {
  $$('[data-step]').forEach((el) => (el.hidden = Number(el.dataset.step) !== state.step));
  $$<HTMLElement>('[data-step-ind]', document).forEach((li) => {
    const n = Number(li.dataset.stepInd);
    li.classList.toggle('cur', n === state.step); li.classList.toggle('done', n < state.step);
    li.querySelector('.dot')!.textContent = n < state.step ? '✓' : String(n);
    if (n === state.step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  $('[data-back]').hidden = state.step === 1;
  const next = $<HTMLButtonElement>('[data-next]');
  next.textContent = state.step === 6 ? 'Confirm booking' : 'Continue';
  next.className = state.step === 6 ? 'btn btn-grad btn-lg' : 'btn btn-dark btn-lg';
  $$<HTMLButtonElement>('[data-pick="service"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === state.service)));
  $$<HTMLButtonElement>('[data-pick="mode"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === state.mode)));
  if (state.step === 3) buildDates();
  if (state.step === 4) buildTimes();
  if (state.step === 6) fillSummary();
  const h = $<HTMLElement>(`[data-step="${state.step}"] h2`);
  h && h.focus({ preventScroll: true });
}

function svc() { return cfg.services.find((s) => s.id === state.service); }
function whenText() { return state.date && state.time >= 0 ? `${longDate(state.date)}, ${timeLabel(state.time)} IST` : ''; }
function field(name: string) { return (form.elements.namedItem(name) as HTMLInputElement | null); }

function fillSummary() {
  $('[data-sum="service"]').textContent = svc()?.title || '';
  $('[data-sum="mode"]').textContent = state.mode;
  $('[data-sum="when"]').textContent = whenText();
  const company = field('business')!.value.trim();
  $('[data-sum="you"]').textContent = `${field('name')!.value.trim()} · +91 ${digits()} · ${field('email')!.value.trim()}${company ? ' · ' + company : ''}`;
}

function digits() { return field('mobile')!.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, ''); }

function showErr(k: string, msg: string) { const e = $(`[data-err="${k}"]`); e.textContent = msg; e.hidden = false; }
function clearErr(k?: string) { $$('[data-err]').forEach((e) => { if (!k || e.dataset.err === k) { e.hidden = true; e.textContent = ''; } }); }

function validateDetails() {
  clearErr();
  let ok = true;
  if (field('name')!.value.trim().length < 2) { showErr('name', 'Please enter your full name.'); ok = false; }
  if (!/^[6-9]\d{9}$/.test(digits())) { showErr('mobile', 'Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.'); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field('email')!.value.trim())) { showErr('email', 'Enter a valid email address.'); ok = false; }
  if (!(field('consent') as HTMLInputElement).checked) { showErr('consent', 'Please agree so we can arrange the call.'); ok = false; }
  if (!ok) { const first = $$('[data-err]').find((e) => !e.hidden); first?.closest('.field, div')?.querySelector<HTMLElement>('input, select, textarea')?.focus(); }
  return ok;
}

async function submitBooking() {
  const s = svc();
  field('service')!.value = s ? s.title : state.service;
  field('meeting_mode')!.value = state.mode;
  field('date')!.value = state.date ? longDate(state.date) : '';
  field('time_ist')!.value = state.time >= 0 ? timeLabel(state.time) + ' IST' : '';
  field('mobile')!.value = '+91 ' + digits();
  const body = new URLSearchParams(new FormData(form) as any).toString();
  const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!res.ok) throw new Error('Form submit failed: ' + res.status);
}

function showDone() {
  $$('[data-step]').forEach((el) => (el.hidden = true));
  $('[data-nav]').hidden = true;
  document.querySelector<HTMLElement>('[data-steps]')!.hidden = true;
  const done = $('[data-done]'); done.hidden = false;
  const first = field('name')!.value.trim().split(/\s+/)[0];
  $('[data-done-title]').textContent = first ? `Request received, ${first}.` : 'Request received.';
  $('[data-done-when]').textContent = `${whenText()} · ${state.mode} · ${svc()?.title || ''}`;
  const docs = (svc()?.docs?.length ? svc()!.docs : cfg.baseDocs).slice(0, 6);
  $('[data-done-docs]').innerHTML = docs.map((d) => `<li>${d.replace(/[<>&]/g, '')}</li>`).join('');
  const start = utcStamp(state.date, state.time), end = utcStamp(state.date, state.time + 30);
  const title = `${cfg.brand} funding review`;
  const details = `Free 30-minute funding review with ${cfg.brand} (${state.mode}). Topic: ${svc()?.title || ''}. Questions: ${cfg.email}`;
  const g = new URL('https://calendar.google.com/calendar/render');
  g.searchParams.set('action', 'TEMPLATE'); g.searchParams.set('text', title); g.searchParams.set('dates', `${start}/${end}`); g.searchParams.set('details', details);
  $<HTMLAnchorElement>('[data-gcal]').href = g.toString();
  $('[data-ics]').onclick = () => {
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FV Funding//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:${start}-${Math.random().toString(36).slice(2)}@financevinance.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${title}`, `DESCRIPTION:${details.replace(/,/g, '\\,')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a'); a.href = url; a.download = 'fv-funding-review.ics'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  $<HTMLElement>('[data-done-title]').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- events ----------
form.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!t) return;
  if (t.dataset.pick === 'service') { state.service = t.dataset.value || ''; clearErr('step'); render(); }
  else if (t.dataset.pick === 'mode') { state.mode = t.dataset.value || ''; clearErr('step'); render(); }
  else if (t.dataset.goto) { state.step = Number(t.dataset.goto); clearErr(); render(); }
});

$('[data-back]').addEventListener('click', () => { state.step = Math.max(1, state.step - 1); clearErr(); render(); });

$('[data-next]').addEventListener('click', async () => {
  clearErr('step');
  if (state.step === 1 && !state.service) return showErr('step', 'Choose a topic to continue.');
  if (state.step === 2 && !state.mode) return showErr('step', 'Choose how you would like to meet.');
  if (state.step === 3 && !state.date) return showErr('step', 'Choose a date to continue.');
  if (state.step === 4 && state.time < 0) return showErr('step', 'Choose a time to continue.');
  if (state.step === 5 && !validateDetails()) return;
  if (state.step === 6) {
    const btn = $<HTMLButtonElement>('[data-next]');
    btn.disabled = true; btn.textContent = 'Sending…';
    try { await submitBooking(); showDone(); }
    catch { btn.disabled = false; btn.textContent = 'Confirm booking'; showErr('submit', `Sorry, the booking could not be sent. Please try again, or email ${cfg.email}.`); }
    return;
  }
  state.step += 1; render();
});

form.addEventListener('submit', (e) => e.preventDefault());
const msg = field('message') as unknown as HTMLTextAreaElement;
msg.addEventListener('input', () => { $('[data-count]').textContent = String(msg.value.length); });

// Pre-select a service from the URL (?service=working-capital-loans), used by service pages and the Readiness Check
const params = new URLSearchParams(location.search);
const pre = params.get('service');
if (pre && cfg.services.some((s) => s.id === pre)) { state.service = pre; state.step = 2; }
field('source')!.value = params.get('from') || document.referrer.replace(location.origin, '') || 'direct';
if (cfg.booking.modes.length === 1) state.mode = cfg.booking.modes[0];
render();
