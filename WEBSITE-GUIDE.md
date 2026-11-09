# FV Funding website — owner's guide

The website for financevinance.com. Built with Astro (fast static pages), Sveltia CMS (admin panel) and Netlify (hosting and forms).

## 1. Where everything is

| What | File | Edit in admin? |
| --- | --- | --- |
| Contact email, phone, WhatsApp, city, hours, legal details, announcement bar, social links, booking hours and holidays | `src/data/settings.json` | Yes: Site settings › Contact details |
| All homepage text | `src/data/home.json` | Yes: Site settings › Homepage text |
| FAQs (FAQ page + homepage) | `src/data/faqs.json` | Yes: Site settings › FAQs |
| The nine services (each has its own page) | `src/content/services/*.md` | Yes: Services |
| Blog / insights articles | `src/content/insights/*.md` | Yes: Insights |
| Uploaded images | `public/uploads/` | Yes: through any image field |
| Logo, icons, share image | `public/brand/`, `public/*.png` | No (locked brand files) |
| Colours, fonts, spacing | `src/styles/global.css` | No (developer / Claude) |
| Page layouts | `src/pages/`, `src/components/` | No (developer / Claude) |
| Privacy, terms, disclaimer, grievance text | `src/pages/privacy.astro` etc. | No (developer / Claude) |

**Rules that keep things working**

- Leave phone or WhatsApp empty and the buttons disappear; fill them and they appear on every page.
- Legal entity details show in the footer as soon as you fill them.
- A service's page address comes from its file name (`term-loans.md` → `/services/term-loans/`). Don't rename files once live; Google has indexed them.
- Tick **Draft** on an article to hide it without deleting it.

## 2. One-time setup (about 30 minutes)

### a) GitHub (stores the website files)

1. Create a free account at github.com (use info.financevinance@gmail.com).
2. Create a **private** repository named `fv-funding-website`.
3. Upload the contents of this `04_Site_Code` folder to it (GitHub's "uploading an existing file" link, or ask Claude to walk you through it). Do not upload `node_modules` or `dist`.
4. Done: `public/admin/config.yml` points to `financevinance/fv-funding-website`.

### b) Netlify (hosting)

1. In Netlify: Add new site › Import an existing project › GitHub › choose `fv-funding-website`.
2. Build settings are read from `netlify.toml` automatically (build `npm run build`, publish `dist`).
3. **Forms:** Site configuration › Forms › enable form detection. Then Forms › Form notifications › add an email notification to funding@financevinance.com for the `booking` and `contact` forms.
4. **Admin login:** Site configuration › Access & security › OAuth › Install provider › GitHub (needs a GitHub OAuth app: GitHub › Settings › Developer settings › OAuth Apps › New, callback URL `https://api.netlify.com/auth/done`; paste its Client ID and Secret into Netlify).
   - Alternative without OAuth: on the admin login screen choose "Sign in with token" and paste a GitHub fine-grained personal access token limited to this one repository (Contents: read and write).

### c) Domain (GoDaddy)

1. In Netlify: Domain management › Add domain › financevinance.com (and www).
2. In GoDaddy DNS, keep the nameservers at GoDaddy and change only:
   - `A` record for `@` → the Netlify load balancer IP that Netlify shows you.
   - `CNAME` for `www` → your-site-name.netlify.app
3. **Do not touch** the MX, SPF (TXT) or other records Titan uses, or email stops working.
4. Netlify issues the free SSL certificate automatically once DNS points to it.

### d) Google

- Search Console: add financevinance.com, verify with a DNS TXT record in GoDaddy, submit `https://financevinance.com/sitemap-index.xml`.
- Business Profile: create "FV Funding" as a service-area business (Ahmedabad / Gujarat), hours 10 am–7 pm daily, website financevinance.com.

## 3. Everyday editing

1. Go to **financevinance.com/admin/** and sign in.
2. Pick a section (Insights, Services, Site settings), make the change, click **Save / Publish**.
3. The site updates by itself in about one minute.

**Posting an article:** Insights › New Article › title, date, category, summary, optional cover image, the article text › Publish.

**Blocking a holiday:** Site settings › Contact details › Booking availability › Holidays › add `2026-12-25` › Publish.

## 4. Editing with Claude

All content is plain files, so Claude can change anything directly: open a session with this folder connected and say what to change ("add a FAQ about…", "write an article on…", "change the hours to…"). Claude edits the file, and you upload it to GitHub (or Claude commits it if GitHub is connected).

## 5. Bookings

- Each booking arrives as a **request** in Netlify › Forms › booking, and by email once notifications are on.
- Reply to the client from funding@financevinance.com to confirm the slot.
- **Later upgrade:** connect Cal.com (linked to info.financevinance@gmail.com) for live availability and automatic confirmations. The booking screens stay the same; only `src/scripts/booking.ts` changes.

## 6. Running it on a computer (developers / Claude)

```
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

Requires Node.js 22.23.4 or newer.

## 7. Before full launch — checklist

- [ ] Lawyer review of Privacy, Terms, Disclaimer and Grievance pages
- [ ] Netlify form notifications sending to funding@financevinance.com
- [ ] Test booking from a phone after go-live
- [ ] Phone / WhatsApp numbers added (optional)
- [ ] Legal entity details added (before ads or lender agreements)
- [ ] Google Search Console and Business Profile set up
