# Deploying to www.ozoneentertainmentz.com

This replaces the previous corporate site (`Ozone/ozone-website`) on that domain.

## Blocker: the API must be reachable from the internet

This site is not standalone — every page reads from the Django API in `../backend`. Locally that
is `http://localhost:8000/api`. **Deployed with that value, every page renders an empty state**:
no events, no ticket tiers, no voting, and the RIMBA feature disappears from the home page.

So before the domain moves, answer this: **where is the Django API deployed?**

- If it is already deployed (the `../backend/build.sh` script looks like a Render build hook), get
  that origin — it is in the existing Vercel project's `NEXT_PUBLIC_API_URL` env var, under
  Settings → Environment Variables.
- If it is not deployed, it has to be deployed first. The site can go live without it, but nothing
  on it will work.

## 1. Environment variables

In the Vercel project, Settings → Environment Variables, for Production:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<your-api-host>/api` — **not** localhost |
| `NEXT_PUBLIC_FEATURES` | `events,tickets,voting,gallery` |
| `EMAIL_USER` | `ozoneentertainments1@gmail.com` |
| `EMAIL_PASS` | the Gmail app password |
| `CONTACT_EMAIL` | `ozoneentertainments1@gmail.com` |

`NEXT_PUBLIC_*` values are baked in at build time, so changing them needs a redeploy, not just a
restart.

## 2. Django has to allow the new origin

Ticket purchase runs in the browser (`POST /tickets/checkout/purchase/`), so it is subject to CORS.
`backend/ozone/settings/prod.py` defaults `CORS_ALLOWED_ORIGINS` to an **empty list**, which means
the browser will block the purchase request and buyers will see a network error.

On the API host, set:

```
CORS_ALLOWED_ORIGINS=https://www.ozoneentertainmentz.com,https://ozoneentertainmentz.com
ALLOWED_HOSTS=<your-api-host>
```

Page content itself is fetched server-side and is unaffected by CORS — which is why the site can
look fine while buying a ticket still fails. Test an actual purchase, not just the page load.

## 3. Deploy, and check it on the Vercel URL first

Do not point the domain at it yet.

1. Vercel → Add New → Project → import `Ishimwediane/events-site`.
2. Framework preset: Next.js. Root directory: repository root. Build command and output: defaults.
3. Set the env vars above, then deploy.
4. Open the `*.vercel.app` URL and confirm, with the production API:
   - the home page features an upcoming event with real prices
   - `/events` lists upcoming and past events
   - `/voting` shows campaigns, or its empty state if none are published
   - `/gallery` shows the photos
   - **a real ticket purchase succeeds and the QR email arrives**
   - the contact form sends

Only move on once a purchase works end to end.

## 4. Move the domain

A domain can only be attached to one Vercel project at a time, so it must be removed from the old
one first. There is a gap of a minute or two between the two steps — do it at a quiet hour.

1. Old project (`ozone-website`) → Settings → Domains → remove `www.ozoneentertainmentz.com` and
   the apex `ozoneentertainmentz.com`.
2. New project (`events-site`) → Settings → Domains → add `www.ozoneentertainmentz.com`, then add
   `ozoneentertainmentz.com` and set it to redirect to the `www` host.
3. DNS does not need changing if both projects are on the same Vercel account — the records already
   point at Vercel. Vercel reissues the TLS certificate automatically, usually within minutes.
4. Do not delete the old project. Keep it deployed on its `*.vercel.app` URL until the new site has
   been live for a while — it is the rollback.

## 5. Afterwards

- Check `https://www.ozoneentertainmentz.com/portfolio` redirects to `/gallery`, and that
  `/services/naf-model-empire` and `/about` redirect to `/`. Those redirects live in
  `next.config.ts`.
- The ticketing platform stays where it is on `events.ozoneentertainmentz.com` — nothing in this
  move touches it.
- Submit the new sitemap in Google Search Console. The removed pages will drop out of the index
  over a few weeks; the 301s pass their ranking on.

## Rolling back

Remove the domain from `events-site`, add it back to `ozone-website`. Same two-step gap.

## Known-bad data to fix before launch

Both are in the database, not this code, and both are visible on the live site:

1. **RIMBA ticket sales are closed.** All three tiers have `sale_start` after `sale_end`, both in
   the past, so the event page shows "Sales closed". Nothing can be sold until this is fixed.
2. **RIMBA's date is 26 Aug 2026** in the database; the flyer says 12 Sept 2026. The organiser is
   also recorded as "AGACIRO ENTERTAINMENT AWARDS 2026" rather than Unity Models Management, so the
   "… Presents" line reads wrong.

The Agaciro voting campaign is still `DRAFT`, so `/voting` will show its empty state until it is
published.
