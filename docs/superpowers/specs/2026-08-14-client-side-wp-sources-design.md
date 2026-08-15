# Client-side wp.stolaf.edu sources

Design for [issue #7755](https://github.com/StoDevX/AAO-React-Native/issues/7755).

## Problem

`wp.stolaf.edu` returns `403 Forbidden` to ccc-server's egress IP, `104.131.161.75`,
on every path except `robots.txt`. The same URLs return `200` from an off-campus
laptop, and the user-agent makes no difference — `ccc-server/0.2.0`, curl, and a
full browser header set all get the same 403. `www.stolaf.edu` is unaffected, so
the block is specific to the `wp.stolaf.edu` host.

The block is total. Every one of the 2876 requests ccc-server made to
`wp.stolaf.edu` in the five days of available container logs returned 403; not
one succeeded.

Three production endpoints 500 as a result:

| Endpoint | Upstream | Failure |
| --- | --- | --- |
| `/v1/news/named/stolaf` | `wp.stolaf.edu/wp-json/wp/v2/posts` | 403 |
| `/v1/a-to-z` | `wp.stolaf.edu/wp-json/site-data/sidebar/a-z` | 403 |
| `/v1/calendar/named/stolaf` | Google Calendar API | 404 |

The calendar is a separate, unrelated failure: its calendar id,
`5g91il39n0sv4c2bjdv1jrvcpq4ulm4r@import.calendar.google.com`, returns 404
globally — from the server and from an off-campus laptop alike. That imported
calendar was a subscription to `webcal://wp.stolaf.edu/calendar/?post_type=tribe_events&ical=1&eventDisplay=list`,
and it no longer exists.

The TEC iCal export it pointed at now returns 403 to everyone, including
off-campus clients, so the webcal route is dead at the source. St. Olaf's events
live in The Events Calendar on a WordPress multisite subsite, reachable at
`https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events`. Note the
subsite root — the top-level `wp-json` returns `total: 0`.

`/v1/jobs` fails from the same IP block and is tracked separately in
[#7759](https://github.com/StoDevX/AAO-React-Native/issues/7759).

## Decision

The app fetches `wp.stolaf.edu` directly instead of proxying through ccc-server.
Campus networks get more generous rate limits than a lone DigitalOcean droplet,
so client-direct is a better position than the proxy, not merely a workaround.

Moving the fetch into the app costs the ability to fix an upstream change without
an App Store release. A published source manifest buys that back: the app resolves
each source's URL and format from a JSON document that can be edited without a
release.

## The source manifest

### Format

The manifest is a JRD document — the JSON Resource Descriptor defined in
[RFC 7033 §4.4](https://www.rfc-editor.org/rfc/rfc7033#section-4.4).

We use the document format only, not the WebFinger protocol. WebFinger means
serving `.well-known/webfinger` on the host being described, and we do not own
`stolaf.edu`. Reusing JRD standalone is well-established — host-meta
([RFC 6415](https://www.rfc-editor.org/rfc/rfc6415)) does the same — but this is
not WebFinger and should not be described as such.

Each `links` entry describes one source:

- **`rel`** — the kind of source. Must be a registered relation or a URI; no
  registered relation means "the news feed", so we mint URIs under
  `https://frogpond.tech/rel/`.
- **`href`** — where to fetch it.
- **`type`** — the format, as a media type. Registered types where they exist
  (`application/rss+xml`, `text/calendar`); the vendor tree otherwise.
- **`titles`** — human-readable label, keyed by language tag. `und` is the
  BCP 47 subtag for "undetermined". Nothing renders these today; they are kept
  for a future source picker.
- **`properties`** — machine-readable identity. Member names are URIs by spec, so
  the source id lives at `https://frogpond.tech/ns/id`.

Several entries share a `rel`; that is how JRD expresses "here are the N things
of this kind". `properties.id` distinguishes them. Minting a rel per source
(`.../rel/news/stolaf`) was rejected: it conflates the relation with the
instance, and turns "list every news source" into a prefix match over URIs.

On the `vnd.` types: [RFC 6838](https://www.rfc-editor.org/rfc/rfc6838) says
vendor-tree subtypes should be registered with IANA, and ours will not be. That
is normal for private use and nothing breaks, but these are not blessed
identifiers.

### Content

```json
{
  "subject": "https://stolaf.edu",
  "links": [
    {
      "rel": "https://frogpond.tech/rel/news",
      "href": "https://wp.stolaf.edu/wp-json/wp/v2/posts?per_page=10&_embed=true",
      "type": "application/vnd.wordpress.v2.posts+json",
      "titles": {"und": "St. Olaf News"},
      "properties": {"https://frogpond.tech/ns/id": "stolaf"}
    },
    {
      "rel": "https://frogpond.tech/rel/news",
      "href": "https://stolaf.api.frogpond.tech/v1/news/named/mess",
      "type": "application/vnd.frogpond.feed-items+json",
      "titles": {"und": "The Manitou Messenger"},
      "properties": {"https://frogpond.tech/ns/id": "mess"}
    },
    {
      "rel": "https://frogpond.tech/rel/news",
      "href": "https://stolaf.api.frogpond.tech/v1/news/named/oleville",
      "type": "application/vnd.frogpond.feed-items+json",
      "titles": {"und": "Oleville"},
      "properties": {"https://frogpond.tech/ns/id": "oleville"}
    },
    {
      "rel": "https://frogpond.tech/rel/a-to-z",
      "href": "https://wp.stolaf.edu/wp-json/site-data/sidebar/a-z",
      "type": "application/vnd.stolaf.a-z+json",
      "titles": {"und": "A–Z Index"},
      "properties": {"https://frogpond.tech/ns/id": "stolaf"}
    },
    {
      "rel": "https://frogpond.tech/rel/a-to-z",
      "href": "https://stolaf.dev/AAO-React-Native/a-to-z.json",
      "type": "application/vnd.frogpond.a-z-extras+json",
      "titles": {"und": "A–Z Index extras"},
      "properties": {"https://frogpond.tech/ns/id": "extras"}
    },
    {
      "rel": "https://frogpond.tech/rel/calendar",
      "href": "https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events?per_page=50",
      "type": "application/vnd.tribe.events.v1+json",
      "titles": {"und": "St. Olaf Calendar"},
      "properties": {"https://frogpond.tech/ns/id": "stolaf"}
    },
    {
      "rel": "https://frogpond.tech/rel/calendar",
      "href": "https://stolaf.api.frogpond.tech/v1/calendar/named/northfield",
      "type": "application/vnd.frogpond.events+json",
      "titles": {"und": "Northfield"},
      "properties": {"https://frogpond.tech/ns/id": "northfield"}
    },
    {
      "rel": "https://frogpond.tech/rel/calendar",
      "href": "https://stolaf.api.frogpond.tech/v1/calendar/named/krlx-schedule",
      "type": "application/vnd.frogpond.events+json",
      "titles": {"und": "KRLX Schedule"},
      "properties": {"https://frogpond.tech/ns/id": "krlx-schedule"}
    },
    {
      "rel": "https://frogpond.tech/rel/calendar",
      "href": "https://stolaf.api.frogpond.tech/v1/calendar/named/ksto-schedule",
      "type": "application/vnd.frogpond.events+json",
      "titles": {"und": "KSTO Schedule"},
      "properties": {"https://frogpond.tech/ns/id": "ksto-schedule"}
    }
  ]
}
```

Sources that stay proxied are manifest entries too, pointing at ccc-server with
a pass-through type. The manifest is the registry for every source regardless of
who fetches it, so migrating one later is a manifest edit plus whatever parser it
needs. Oleville keeps its current behaviour by pointing at the server's
deprecation stub — a dead source needs no new concept, it is just a source whose
`href` happens to be a stub.

### Hosting

The file is `sources.json`, committed to this repository's `gh-pages` branch
alongside `a-to-z.json`, `contact-info.json` and the rest, and published at
`https://stolaf.dev/AAO-React-Native/sources.json`.

ccc-server proxies it at a new `/v1/sources` route, read via the existing
`GH_PAGES()` helper the same way `a-to-z.json` already is. The app fetches it
through ccc-server rather than from GitHub Pages directly, which keeps the app
pointed at one configurable base URL — so the Settings server-URL override
applies to the manifest too.

GitHub Pages serves `.json` as `application/json`, not `application/jrd+json`,
and offers no way to change that. Nothing depends on the response's own content
type.

Serving the manifest per-institution falls out of this for free: Carleton's
deployment answers `/v1/sources` with its own document, and the rel URIs are
institution-neutral. Nothing in the manifest format assumes St. Olaf beyond the
contents of this particular file.

## Resolution

A new `modules/data-sources/` module owns fetching, validating and resolving the
manifest.

```ts
sourceOptions(rel, id)   // → {href, type, title}
sourcesOptions(rel)      // → Array<{id, href, type, title}>
```

Resolution order: fetched-or-bundled document → filter `links` by `rel` → find by
`properties['https://frogpond.tech/ns/id']` → look `type` up in the parser
registry → fetch `href` → parse.

The module ships a bundled copy of `sources.json`, identical to the published
one, used whenever the fetched document is unusable.

The manifest is fetched through React Query with a 24-hour `staleTime`. On-device
caching needs no new dependency: the app already persists every query result via
`createAsyncStoragePersister` (`source/init/tanstack-query.ts:21`), wired through
`PersistQueryClientProvider` (`app/_layout.tsx:52`).

### Fallback rules

In priority order:

1. Fetch fails, times out, or fails zod validation → use the bundled document
   wholesale.
2. Document is valid but a `rel`/`id` pair is missing → use the bundled entry for
   that source.
3. Document is valid and the source is present, but its `type` has no parser in
   this build → use the bundled entry for that source.

Rule 3 is what makes the manifest safe to edit. A build that predates a new
format tag keeps using the source it knows instead of failing on a shape it has
never seen, so publishing a change cannot break older installs.

These rules cover resolving a source, not fetching one. If the upstream itself
fails — a student off campus hitting a `wp.stolaf.edu` block, or the site being
down — that surfaces through the existing React Query error and retry UI like any
other failed request. There is no fallback source to switch to, and pretending
otherwise would hide a real outage.

## Parsers

| Type | From | PR |
| --- | --- | --- |
| `application/vnd.wordpress.v2.posts+json` | `feeds/wp-json.ts` | 1 |
| `application/vnd.stolaf.a-z+json` | `v1/a-z.ts` | 1 |
| `application/vnd.frogpond.a-z-extras+json` | `v1/a-z.ts` | 1 |
| `application/vnd.tribe.events.v1+json` | new | 1 |
| `application/vnd.frogpond.feed-items+json` | pass-through | 1 |
| `application/vnd.frogpond.events+json` | pass-through | 1 |
| `application/rss+xml` | `feeds/rss.ts` | 2 |
| `text/calendar` | `calendar/ical.ts` | 2 |

Parsers ship ahead of need. A format tag only buys agility if the parser is
already on the device — otherwise rule 3 fires and publishing a manifest change
does nothing until a release.

No Google Calendar JSON parser. Every Google calendar we use is also reachable as
a public ICS feed with no API key, so no key needs to ship in the binary; but
those feeds are the entire calendar, unexpanded, and far too large to be worth
fetching directly:

```
northfield  5.1 MB raw / 1.4 MB gzipped   7380 events,  381 RRULEs
krlx        1.8 MB raw / 311 KB gzipped   4392 events, 4388 RRULEs
ksto         27 KB raw / 4.7 KB gzipped     79 events,   79 RRULEs
```

ccc-server's Google API call asks for 50 upcoming expanded events and returns a
few KB. Those three calendars stay proxied. The `text/calendar` parser still
ships in PR 2 as an escape hatch should Google ever block the droplet, and
because it makes any small ICS feed a manifest edit — KSTO would flip cheaply
today. The large two should not be flipped by default.

### Porting notes

`@frogpond/html-lib` already covers everything ccc-server used JSDOM for:
`fastGetTrimmedText` for excerpt and title, `htmlToSegments` for pulling `href`s
out of anchors in place of the server's `get-urls`. zod 4, ky and date-fns are
already dependencies. `moment` must not be used in new code.

The RSS parser needs XML parsing, but `htmlparser2` and `css-select` are already
dependencies of `@frogpond/html-lib`, so no new package is required.
`html-lib`'s `parseHtml` hardcodes `xmlMode: false`, so an XML variant is needed.
In xmlMode, `dc:creator` is an ordinary tag name.

`ical.js` is the only genuinely new dependency in the whole change, and it lands
in PR 2.

## Per-feature changes

Call sites do not change. `namedNewsOptions('stolaf')` keeps its signature and
resolves rel + id underneath, so `app/(home)/News/index.tsx:9`,
`app/(home)/Calendar/index.tsx:28` and `app/(home)/More/index.tsx:40` are
untouched.

### News

`source/features/news/query.ts` resolves through the manifest and parses
client-side. The wire shape stays `StoryType`.

`rssNewsOptions` and `wpJsonNewsOptions` in that file have no callers and are
deleted.

### A–Z

`source/features/more/query.ts` resolves through the manifest. The app takes over
the merge ccc-server was doing.

A–Z has two sources, so it uses `sourcesOptions(A_TO_Z)` rather than a single
lookup: the St. Olaf document (`id: "stolaf"`) and the extras published on
`gh-pages` (`id: "extras"`). Both are manifest entries — hardcoding the extras
URL would undercut the point of having a manifest.

The app fetches both, normalises and validates each value, combines them by
letter, and re-sorts the letters that gained entries. The normalisation rules
port directly from `normalizeAndValidateAzValues` in the server's `v1/a-z.ts`:
trim label and url, drop entries where both are empty, resolve `/`-relative urls
against `https://stolaf.edu`, and drop entries whose url still fails validation.

If the extras fetch fails, the St. Olaf list renders alone rather than the whole
screen failing. Today ccc-server 500s if either half fails; a decorative
supplement should not take down the index.

The app already fetches `github.io` URLs directly for map data, so this follows
an existing pattern.

### Calendar

`modules/ccc-calendar/query.ts` resolves through the manifest. The TEC parser
emits the same wire shape ccc-server does, so `convertEvents` and everything
downstream are untouched.

`reasonCalendarOptions` is deleted — Carleton moved to WordPress, it has no
callers, and it fetched `calendar/reason`, a route that does not exist on the
server.

### TEC to EventType

```
dataSource   'tribe'
startTime    utc_start_date + 'Z'
endTime      utc_end_date + 'Z'
title        decode(title)
description  fastGetTrimmedText(description)
location     venue?.venue ?? ''
isOngoing    startTime before today
links        hrefs from htmlToSegments(description), plus the event url
config       {startTime: !all_day, endTime: !all_day, subtitle: 'location'}
```

Four details the live payload requires:

- `utc_start_date` is `"2026-08-17 13:00:00"` — space separator, no zone marker.
  It must be converted to `2026-08-17T13:00:00Z` explicitly or it will be read as
  local time and shift by five hours.
- `venue` is **absent entirely** on some events, not present-but-null.
- `description` can be `<div data-modular-content-collection></div>`, which
  strips to an empty string. Empty descriptions are normal and are not a parse
  failure.
- `all_day` is a real flag. All-day events get `startTime: false, endTime: false`
  rather than rendering as 00:00–23:59. This is a deliberate improvement on the
  Google parser, which always sent `true`.

The request passes `per_page=50` and a `start_date` of now, matching the 50-event
upcoming window the Google fetch used. Without `start_date` TEC defaults to a
two-year range.

## ccc-server changes

- New `/v1/sources` route serving `sources.json` via `GH_PAGES()`.
- `news/named/stolaf`, `a-to-z` and `calendar/named/stolaf` return the
  `deprecatedWpJson()`-style stub, so shipped builds show a "no longer updated"
  notice instead of an error screen.
- `v1/a-z.ts` and the stolaf branch of `news.ts` are removed. `feeds/wp-json.ts`
  stays — the Mess still uses it.
- `calendar/named/oleville` is removed. It 500s on a second dead
  `@import.calendar.google.com` id and nothing references it.

## Testing

Parser tests run against fixtures captured from the live endpoints, including a
TEC event with no venue and an all-day TEC event.

Resolution tests cover each fallback rule separately: fetch failure, malformed
document, missing rel/id, and unknown `type`.

Nothing asserts on mocked behaviour — the fixtures are real recorded responses and
the assertions are on our own transforms.

## Sequencing

**PR 1** — manifest, `modules/data-sources/`, the `/v1/sources` route and the
server stubs, and six parsers: wp-v2-posts, stolaf-a-z, a-z-extras, tec-events,
and the two pass-throughs (feed-items and events). News, A–Z and Calendar work
again.

**PR 2** — the rss and ical parsers.

Splitting keeps the production fix from waiting on porting `ical.js`. Flipping a
source to direct fetching requires a manifest edit either way, so nothing is
exposed by the second PR landing later.

## Out of scope

- `/v1/jobs`, tracked in [#7759](https://github.com/StoDevX/AAO-React-Native/issues/7759),
  though it fails from the same IP block and this design is what will fix it.
- `expo-sqlite` and a general on-device cache layer. React Query's existing
  AsyncStorage persistence already covers this change's needs; SQLite earns its
  place where data must be queried rather than read back whole — course search,
  the directory, the dictionary — and deserves its own design.
- Asking St. Olaf IT to unblock `104.131.161.75`. Worth doing regardless, and it
  would fix `/v1/jobs` without code, but it is not a dependency of this work.
