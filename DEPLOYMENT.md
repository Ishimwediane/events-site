# Deploying to www.ozoneentertainmentz.com

This replaces the previous corporate site (`Ozone/ozone-website`) on that domain.

**API:** `https://event-backend-tex3.onrender.com/api` (Render, backed by the same Supabase
database as local development).

## Already verified

A production build of this site was run against that API before writing this. All of it works:

- events, ticket tiers and prices come back correctly
- flyers load from Cloudinary through Next's image optimiser
- every route returns 200; the old URLs 301 correctly
- CORS from `www.ozoneentertainmentz.com` is already allowed (see below)

So there is no code change needed to go live — only Vercel configuration.

## Which Vercel project is which

| Project | Serves | Do what |
| --- | --- | --- |
| `ozone-website` | **www.ozoneentertainmentz.com** + apex — the old corporate site (services, about, portfolio, NAF Model Empire) | take the domain **off** this one |
| `events-site` | `events-site-phi.vercel.app` — this site | put the domain **on** this one |
| `event` | `events.ozoneentertainmentz.com` — the organiser dashboard and ticket checkout (`../frontend`) | **do not touch**; breaking it breaks ticketing |

Verified live: `www` currently returns the corporate site
("Ozone Entertainment | Events, Fashion, Film and Artist Management"), while
`events.` returns the platform ("OZONE EVENT | Elite Event & Ticket Management").

## 1. The project already exists

`events-site` is deployed at `https://events-site-phi.vercel.app`. It needs the environment
variables below and a redeploy — see the note about the first deployment at the end of section 2.

## 2. Environment variables

Settings → Environment Variables, scope **Production**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://event-backend-tex3.onrender.com/api` |
| `NEXT_PUBLIC_FEATURES` | `events,tickets,voting,gallery` |
| `EMAIL_USER` | `ozoneentertainments1@gmail.com` |
| `EMAIL_PASS` | the Gmail app password |
| `CONTACT_EMAIL` | `ozoneentertainments1@gmail.com` |

`NEXT_PUBLIC_*` values are compiled in at build time, so changing one needs a **redeploy**, not a
restart.

**These are not optional.** Set them all, then redeploy. The first deployment went out with none of
them set, which is why `/events`, `/voting` and `/gallery` returned 404 and the home page showed no
events. The code no longer collapses that way (a blank value now falls back properly), but without
`NEXT_PUBLIC_API_URL` the site still points at `localhost:8000` and will render empty.

## 3. CORS — nothing to do, but know why

`backend/ozone/settings/base.py:228` sets `CORS_ALLOW_ALL_ORIGINS = True`, and `prod.py` never
turns it off. The API therefore answers every origin with
`access-control-allow-origin: *`, confirmed against the live Render deployment. Ticket purchase
from the new domain will work with no change.

The catch: `prod.py:35` builds a `CORS_ALLOWED_ORIGINS` allowlist that **has no effect** —
`CORS_ALLOW_ALL_ORIGINS` wins. Combined with `AllowAny` on
`/tickets/checkout/purchase/`, any website on the internet can create tickets against this API.
That is not a launch blocker, but it should be closed:

```python
# prod.py — make the allowlist actually apply
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
```

then on Render set:

```
CORS_ALLOWED_ORIGINS=https://www.ozoneentertainmentz.com,https://ozoneentertainmentz.com,https://events.ozoneentertainmentz.com
```

Include `events.` — that is the organiser dashboard, and it would otherwise break.

## 4. Render cold starts

Render's free tier sleeps after about 15 minutes idle. The first request then takes **5–10 seconds**
(measured: 7.0s cold, well under a second warm).

Pages are statically generated with a 60-second revalidate window, so visitors are served cached
HTML and do not wait for a cold API. Two places where the delay does show:

- the first ticket purchase after an idle spell — the buyer waits on a live POST
- a background revalidation that lands on a sleeping API — the page keeps serving stale content,
  so no one sees an error

If that becomes annoying, either move the API to a paid Render instance or ping
`/api/events/` every 10 minutes from a cron.

## 5. Deploy and test on the vercel.app URL — leave the domain alone for now

Open the `*.vercel.app` URL and confirm:

- home features RIMBA with real prices
- `/events` lists upcoming and past
- `/voting` shows its empty state (the Agaciro campaign is still `DRAFT`)
- `/gallery` shows the photos and the lightbox works
- the contact form sends a real email
- **a real ticket purchase completes and the QR email arrives**

Only move the domain once that purchase works end to end.

## 6. Move the domain

A domain can only be attached to one Vercel project at a time, so it must be removed from the old
project first. There is a gap of a minute or two — do it at a quiet hour.

1. Old project (`ozone-website`) → Settings → Domains → remove `www.ozoneentertainmentz.com` **and**
   the apex `ozoneentertainmentz.com`.
2. New project (`events-site`) → Settings → Domains → add `www.ozoneentertainmentz.com`, then add
   the apex and set it to redirect to the `www` host.
3. **DNS needs no changes** if both projects are on the same Vercel account — the records already
   point at Vercel. TLS reissues automatically, usually within minutes.
4. **Do not delete the old project.** Keep it deployed on its `*.vercel.app` URL — that is the
   rollback.

## 7. Afterwards

- Check `/portfolio` → `/gallery`, and `/about` and `/services/naf-model-empire` → `/`. Those
  redirects live in `next.config.ts`.
- The organiser dashboard on `events.ozoneentertainmentz.com` is untouched by this move.
- Submit the sitemap in Google Search Console. Removed pages drop out over a few weeks; the 301s
  pass their ranking on.

## Rolling back

Remove the domain from `events-site`, add it back to `ozone-website`. Same two-step gap.

## Known-bad data — fix before launch

All in the database, not this code, and all visible on the live site:

1. **RIMBA ticket sales are closed.** All three tiers have `sale_start` *after* `sale_end`, both in
   the past, so the event page shows "Sales closed" and falls back to the phone numbers. Nothing
   can be sold until this is fixed. Confirmed still true on the Render API.
2. **RIMBA's date is 26 Aug 2026** in the database; the flyer says 12 Sept 2026, 6PM.
3. **RIMBA's organiser** is recorded as "AGACIRO ENTERTAINMENT AWARDS 2026" rather than Unity
   Models Management, so the "… Presents" line on the home page reads wrong.
4. **The Agaciro voting campaign is `DRAFT`**, so `/voting` shows its empty state. Publishing it
   fills the page in with its 33 categories and vote packages, no deploy needed.

Root cause of 1: `apps/events/serializers.py:101` defaults `sale_end` to `event.start_date`, so the
wrong date in 2 poisoned the sale windows.
