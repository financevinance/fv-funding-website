// Funding Readiness Check — runs entirely in the browser; nothing is stored or sent.
type Svc = { id: string; title: string; summary: string; docs: string[] };
const { services } = JSON.parse(document.getElementById('check-data')!.textContent || '{}') as { services: Svc[] };
const byId = (id: string) => services.find((s) => s.id === id);

type Q = { id: string; q: string; opts: { v: string; t: string }[] };
const Qs: Q[] = [
  { id: 'need', q: 'What do you need the funding for?', opts: [
    { v: 'operations', t: 'Running the business: stock, receivables, day-to-day cash' },
    { v: 'machinery', t: 'Buying machinery or equipment' },
    { v: 'capex', t: 'Land, building or adding capacity' },
    { v: 'project', t: 'Setting up a new unit or project' },
    { v: 'expansion', t: 'Expanding: new branch, market or product line' },
    { v: 'refinance', t: 'Refinancing or restructuring existing loans' } ] },
  { id: 'age', q: 'How long has the business been operating?', opts: [
    { v: 'new', t: 'Less than 1 year' }, { v: 'young', t: '1 to 3 years' }, { v: 'est', t: 'More than 3 years' } ] },
  { id: 'turnover', q: 'What is your annual turnover?', opts: [
    { v: 't1', t: 'Under ₹1 crore' }, { v: 't2', t: '₹1–5 crore' }, { v: 't3', t: '₹5–25 crore' }, { v: 't4', t: 'Above ₹25 crore' } ] },
  { id: 'fin', q: 'Are your financial statements and ITRs filed for recent years?', opts: [
    { v: 'yes', t: 'Yes, filed for the last 2–3 years' }, { v: 'part', t: 'Partly, or only recently' }, { v: 'no', t: 'Not yet' } ] },
  { id: 'gst', q: 'How do your GST returns and banking look?', opts: [
    { v: 'clean', t: 'GST filed regularly, sales go through the bank' }, { v: 'gaps', t: 'Some gaps or late filings' }, { v: 'nogst', t: 'Not GST registered' } ] },
  { id: 'security', q: 'Do you have property or assets that could be offered as security?', opts: [
    { v: 'yes', t: 'Yes' }, { v: 'no', t: 'No' }, { v: 'unsure', t: 'Not sure' } ] },
  { id: 'record', q: 'How have existing loans been repaid?', opts: [
    { v: 'none', t: 'No loans so far' }, { v: 'ontime', t: 'Always on time' }, { v: 'delays', t: 'Some delays' } ] },
  { id: 'udyam', q: 'Is the business registered on Udyam (MSME)?', opts: [
    { v: 'yes', t: 'Yes' }, { v: 'no', t: 'No' }, { v: 'unsure', t: 'Not sure' } ] },
];

const box = document.querySelector<HTMLElement>('[data-check]')!;
const area = box.querySelector<HTMLElement>('[data-q-area]')!;
const count = box.querySelector<HTMLElement>('[data-q-count]')!;
const bar = box.querySelector<HTMLElement>('[data-q-bar]')!;
const backBtn = box.querySelector<HTMLButtonElement>('[data-q-back]')!;
const ans: Record<string, string> = {};
let i = 0;

const pre = new URLSearchParams(location.search).get('need');
if (pre && Qs[0].opts.some((o) => o.v === pre)) { ans.need = pre; i = 1; }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

function showQ() {
  const q = Qs[i];
  count.textContent = `Question ${i + 1} of ${Qs.length}`;
  bar.style.width = `${((i + 1) / Qs.length) * 100}%`;
  backBtn.hidden = i === 0;
  area.innerHTML = `<h2 tabindex="-1" style="font-size:clamp(20px,2.6vw,26px);font-weight:700;line-height:1.3">${esc(q.q)}</h2>
    <div class="opts" style="grid-template-columns:1fr">${q.opts.map((o) => `<button type="button" class="opt-btn" data-v="${o.v}" aria-pressed="${ans[q.id] === o.v}"><span class="t">${esc(o.t)}</span></button>`).join('')}</div>`;
  area.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true });
}

area.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-v]');
  if (!b) return;
  if (b.dataset.restart !== undefined) return;
  ans[Qs[i].id] = b.dataset.v!;
  if (i < Qs.length - 1) { i++; showQ(); } else { showResult(); }
});
backBtn.addEventListener('click', () => { if (i > 0) { i--; showQ(); } });

function showResult() {
  const primaryMap: Record<string, string[]> = {
    operations: ['working-capital-loans', 'unsecured-business-loans'],
    machinery: ['machinery-equipment-finance', 'term-loans'],
    capex: ['capex-loans', 'term-loans'],
    project: ['project-finance', 'capex-loans'],
    expansion: ['business-expansion-finance', 'term-loans', 'working-capital-loans'],
    refinance: ['term-loans', 'secured-business-loans'],
  };
  let ids = [...(primaryMap[ans.need] || ['term-loans'])];
  if (ans.security === 'yes' && !ids.includes('secured-business-loans')) ids.push('secured-business-loans');
  if (ans.security === 'no' && ans.need === 'operations' && !ids.includes('unsecured-business-loans')) ids.push('unsecured-business-loans');
  const schemeRelevant = ['machinery', 'capex', 'project'].includes(ans.need) || ans.security !== 'yes';
  if (schemeRelevant) ids.push('government-schemes-subsidies');
  ids = [...new Set(ids)].filter((id) => byId(id));

  const good: string[] = [], watch: string[] = [];
  if (ans.age === 'est') good.push('A track record of more than three years is what most lenders look for first.');
  if (ans.age === 'new') watch.push('Lenders usually prefer a longer track record. Options are narrower for a business under a year old, and promoter strength and contribution matter more.');
  if (ans.age === 'young') watch.push('With one to three years of history, lenders look closely at the trend in turnover and profit.');
  if (ans.fin === 'yes') good.push('Filed financials and ITRs give lenders the base they need.');
  else watch.push('Filed financial statements and ITRs are the base of almost every file. Getting these in order comes first.');
  if (ans.gst === 'clean') good.push('Regular GST filing with sales through the bank makes your numbers easy to verify.');
  if (ans.gst === 'gaps') watch.push('Lenders compare GST returns with bank credits and financials. Gaps need to be explained before you apply.');
  if (ans.gst === 'nogst') watch.push('Without GST returns, lenders rely more on bank statements and filed financials.');
  if (ans.security === 'yes') good.push('Property or assets open secured options, which usually allow larger amounts and longer tenure.');
  if (ans.security === 'no') watch.push('Without collateral, the usual routes are unsecured loans or, for eligible micro and small enterprises, CGTMSE-backed credit.');
  if (ans.record === 'ontime') good.push('A clean repayment record is one of the strongest things you can show.');
  if (ans.record === 'delays') watch.push('Recent repayment delays weigh heavily. They need to be addressed upfront, not discovered by the lender.');
  if (ans.udyam === 'yes') good.push('Udyam registration is in place, which most MSME schemes require.');
  else watch.push('Udyam registration is free and is needed for most MSME schemes and CGTMSE cover.');

  const main = byId(ids[0])!;
  const docs = main.docs.slice(0, 6);
  count.textContent = 'Your result';
  bar.style.width = '100%';
  backBtn.hidden = true;
  const card = (s: Svc, primary: boolean) => `<a class="card card-link" href="/services/${s.id}/" style="${primary ? 'border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)' : ''}"><p class="num">${primary ? 'MOST LIKELY FIT' : 'ALSO WORTH A LOOK'}</p><p class="title" style="font-size:18px">${esc(s.title)}</p><p class="text">${esc(s.summary)}</p></a>`;
  area.innerHTML = `
    <h2 tabindex="-1" style="font-size:clamp(22px,3vw,30px);font-weight:700;line-height:1.25">Facilities that usually fit your answers</h2>
    <div class="grid cols-auto-210 mt-16">${ids.map((id, k) => card(byId(id)!, k === 0)).join('')}</div>
    <div class="grid cols-auto-260 mt-32">
      <div class="card card-paper"><p class="mono muted">In your favour</p>${good.length ? `<ul class="mt-12" style="padding-left:18px;line-height:1.7">${good.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : '<p class="mt-12 muted">We will look for strengths together on the call.</p>'}</div>
      <div class="card card-paper"><p class="mono muted">Worth preparing for</p>${watch.length ? `<ul class="mt-12" style="padding-left:18px;line-height:1.7">${watch.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : '<p class="mt-12 muted">Nothing obvious from these answers.</p>'}</div>
    </div>
    <div class="card mt-16"><p class="mono muted">Documents to start gathering</p><ul class="mt-12" style="padding-left:18px;line-height:1.8">${docs.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
    <div class="btn-row mt-32"><a class="btn btn-grad btn-lg" href="/book/?service=${main.id}&from=check">Book a free review for ${esc(main.title.toLowerCase().startsWith('government') ? 'schemes' : main.title.toLowerCase())}</a><button type="button" class="btn btn-outline btn-lg" data-restart>Start again</button></div>`;
  area.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true });
  area.querySelector<HTMLButtonElement>('[data-restart]')!.addEventListener('click', () => { for (const k in ans) delete ans[k]; i = 0; showQ(); });
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

showQ();
