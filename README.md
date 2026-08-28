# Ozone Events Site

The public, events-only site for Ozone Entertainment: events, ticketing, award voting and a
gallery. It reads and writes through the existing Django API in [`../backend`](../backend) — there
is no second backend and no second database.

Built to match the design of `Ozone/ozone-website` exactly (Outfit headings / Inter body,
`#F39C12` orange, `#08283B` navy, rounded-lg buttons, the orange mini-header, the dark
rule–label–rule page headers), with the non-event service lines left out.

## Running it

The API has to be up first:

```bash
# terminal 1 — the API
cd ../backend
python manage.py runserver 8000

# terminal 2 — this site
npm install
npm run dev          # http://localhost:3001
```

Port 3001 is deliberate: `../frontend` (the organiser dashboard) already uses 3000, so both can
run at once.

## Configuration

`.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Django API base. Default `http://localhost:8000/api`. |
| `NEXT_PUBLIC_FEATURES` | Comma list of `events,tickets,voting,gallery`. |
| `EMAIL_USER`, `EMAIL_PASS`, `CONTACT_EMAIL` | Gmail app password for the contact form. Without them the form returns a clear "not configured" message instead of failing silently. |

### Feature flags

Nothing was deleted to produce the events-only site — sections are switched off. Drop a name from
`NEXT_PUBLIC_FEATURES` and that feature's page returns 404, its nav entry disappears, and its hero
slide is skipped. The code stays in the repo, so one codebase serves both the client's build and a
fuller one:

```bash
NEXT_PUBLIC_FEATURES=events,tickets              # no voting, no gallery
NEXT_PUBLIC_FEATURES=events,tickets,voting,gallery   # everything (default)
```

`src/config/site.ts` holds the flag logic plus every phone number, price note and section of copy
the client is likely to reword — one file, no hunting through components.

## What talks to what

| Page | API |
| --- | --- |
| `/` | `GET /events/?page_size=100` — features the next upcoming event |
| `/events` | same, split into upcoming and past |
| `/events/[slug]` | `GET /events/{slug}/` |
| ticket purchase | `POST /tickets/checkout/purchase/` — `{ticket_type_id, quantity, full_name, email}` |
| `/voting` | `GET /voting/campaigns/?status=PUBLISHED` |
| `/gallery` | no API — see below |
| `/services` | no API — content lives in `src/config/site.ts` |
| `/contact` | `POST /api/contact` (this app's own route, nodemailer) |

Reads go through `src/lib/api.ts`, which returns empty results instead of throwing when the API is
unreachable. A marketing page then degrades to an empty state rather than a 500 — the production
build succeeds with the backend switched off.

Upcoming vs past is decided by `end_date` where present, falling back to `start_date`, so an
overnight show stays "upcoming" while it is actually running.

## Gallery has no backend yet

`Event` carries one `flyer` and one `venue_logo` — there is no album model. Until there is, the
gallery is driven by `src/data/gallery.ts` and the optimised images in
`public/images/gallery/`. Upcoming events still get a filter chip showing that photos will land
there after the night.

To finish it properly, add to `apps/events`:

```python
class EventPhoto(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="events/photos/")
    caption = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
```

then swap `albums` for a fetch. `GalleryGrid` already takes that shape, so the component does not
change.

## Two data problems this site surfaces

Both are in the database, not in this code. The site renders what the API returns, which is why
they are visible:

1. **RIMBA sale windows are inverted and in the past.** All three tiers have
   `sale_start` after `sale_end`, both before today, so `/events/rimba-fashion-show-edition-2`
   correctly shows "Sales closed" and falls back to the phone numbers. Nothing can be sold until
   the windows are fixed. Root cause: `apps/events/serializers.py` defaults `sale_end` to
   `event.start_date`, and that start date is wrong.
2. **RIMBA's start date is 26 Aug 2026**; the flyer says 12 Sept 2026, 6PM. The organiser is also
   recorded as "AGACIRO ENTERTAINMENT AWARDS 2026" rather than Unity Models Management, so the
   "… Presents" line on the homepage reads wrong.

The Agaciro voting campaign is still `DRAFT`, so `/voting` shows its empty state. Publish the
campaign and the page fills in on its own.

## Notes

- Kigali is UTC+2 and the API stores UTC; all formatting in `src/lib/format.ts` renders in
  `Africa/Kigali`.
- Flyers arrive either as full Cloudinary URLs or relative media paths depending on how the record
  was made. `src/lib/images.ts` normalises both.
- `/privacy` and `/terms` are deliberately placeholders — they need real text from the client
  rather than boilerplate.
- The contact route escapes user input before it reaches the HTML email body and strips newlines
  from header values. It also does not log anything derived from the password.
