# Calendar list and detail polish

## Why

Five changes bring the calendar closer to Calendar.app, and add the one thing
Calendar.app has that we deferred: a mini timeline showing where an event falls
among its neighbours.

`2026-08-16-calendar-event-detail-swiftui-design.md` set the timeline aside
because "we have neither the surrounding-events query nor geocoding". Half of
that is no longer true. `useMergedEvents` already holds a month of every enabled
calendar, cached under stable React Query keys, so the surrounding events are a
filter over data the detail screen can read for free. The map thumbnail stays
out; geocoding is still absent.

## Evidence

Apple's metrics below are measured from screenshots of Calendar.app and of our
app, taken a minute apart on the same 1179x2556 device, so type settings match.
Cap heights are divided by SF's ~0.72 cap ratio to recover the point size.

| Measured | Apple | Ours |
| --- | --- | --- |
| List row subtitle, cap height | 32px → 15pt (`subheadline`) | 28px → 13pt (`footnote`) |
| List row location glyph | ~27x34px balloon | 13x37px `mappin` |
| Detail title, cap height | 59px → 28pt (`title1`) | native large title |
| Detail date lines, cap height | 36px → 17pt (`body`) | `body` |
| Timeline hour spacing | 120px → 40pt per hour | — |
| Timeline hour labels | 25px → 12pt (`caption`) | — |

The measured 15/13 subtitle ratio (1.154) matches the pixel ratio (1.143).

The timeline block's top edge sits at 07:49 ± 3pt for an event starting 07:45,
so blocks are positioned linearly, and the first gridline is the top of the hour
containing the start. The block runs past the last gridline and is clipped by
the card.

## 1. Calendars button to the trailing end

`modules/ccc-calendar/calendar-picker.tsx` moves `Stack.Toolbar.Spacer` ahead of
the `Menu`.

The doc comment claiming Calendar.app keeps its picker at the left is wrong and
gets rewritten: Calendar.app puts `Today` at the leading end and the
calendars/inbox pill at the trailing end.

## 2. The list row's location line

`modules/event-list/event-list-row.tsx`:

- Subtitle text goes `footnote` → `subheadline`.
- The hand-rolled `HStack spacing={4}` of `Image` + `Text` becomes a `Label`,
  SwiftUI's icon-tracks-title primitive, so the glyph sits on the text's
  baseline and scales with it.
- The glyph goes `mappin` → `location.circle`. Not identical to Apple's
  balloon-with-arrow, and chosen deliberately as close enough.
- The `Image`'s `size={12}` goes away. `@expo/ui` documents `size` as "does not
  scale with Dynamic Type. Use the `font` modifier with `textStyle` for that.
  Ignored when a `font` modifier is supplied." The fixed 12pt glyph is why the
  current pin reads as oversized and off-baseline.

`__tests__/expo-ui-mock.tsx` gains `Label` and `labelStyle`. The mock exports
only what the module imports, so a new import must be added there or the test
run fails at load.

## 3. Detail screen as a sheet

`app/(home)/_layout.tsx` gains
`<Stack.Screen name="EventDetail" options={{presentation: 'pageSheet'}} />`.

`'pageSheet'` rather than the `'modal'` the rest of this layout uses.
`RNSScreen.mm` sets `UIModalPresentationAutomatic` for `'modal'` and
`UIModalPresentationPageSheet` for `'pageSheet'`. UIKit resolves automatic to a
page sheet on iPhone today, so the two look alike, but the inset rounded card
Calendar.app uses is what we want stated outright rather than inferred.
`'formSheet'` is the narrower iPad variant and is not it.

All three entry points — Calendar, KSTOSchedule, KRLXSchedule — get the sheet.
The route stays shared rather than forking a second detail screen.

In `app/(home)/EventDetail.tsx`, `Stack.Title large` and `CLEAR_LARGE_TITLE` are
deleted. With the name in the body there is no large title left to clear.
A `xmark` button at `placement="left"` calls `router.back()`; the existing Share
button stays at the right. Both carry `separateBackground`, which is what makes
them the free-floating glass pills Calendar.app shows over content with no bar.

## 4. The masthead carries the title

`modules/event-list/event-detail-header.tsx` takes `title` alongside `lines` and
draws it in `title1` bold above the date lines. The accent bar spans both, which
the existing `frame({maxHeight: Infinity})` already gives.

## 5. Add to Calendar in the bottom bar

The `Section` comes out of `modules/event-list/event-detail-view.tsx`.
`app/(home)/EventDetail.tsx` gains a bottom toolbar of `Spacer` / Button /
`Spacer`, the shape expo-router's own docstring gives for a centred bar item.

`AddToCalendar` is unchanged: its render prop returns the toolbar.

The button takes `compactMessages`, `children={message || 'Add to Calendar'}`,
`tintColor` set to the calendar's colour (the `color` the page already computes
for the masthead), `disabled` passed straight through, and no icon.

State rides in the label — `Add to Calendar` → `Saving…` → `Saved`, disabled —
so the section footer that carried it needs no replacement. `compactMessages`
already exists on the module for exactly this.

## 6. The mini timeline

### Data

The detail page calls `useCalendarSources()` and `useMergedEvents(enabled)`, the
same hooks the Calendar screen uses, so arriving from the list is a cache read
with no fetch. Events overlapping the window are drawn, each tinted by its
source as the list's rows are.

Two cases draw no timeline:

- All-day events, which have no position.
- Events whose source is not a calendar source — the radio schedules, whose
  events never enter `useCalendarSources()`.

A lone event still gets a timeline. The gate is whether a neighbour *source*
exists, not whether neighbouring events happen to.

Known gap: `deviceCalendarOptions` runs forward from today, while
`deviceCalendarEventOptions` reaches a month back. An event opened from a
back-dated deep link therefore shows no neighbours. Acceptable; deep links to
events do not ship yet.

### Geometry

40pt per hour. Four hourly gridlines, the first at the top of the hour
containing the event's start. Labels in `caption`. Blocks positioned linearly
and clipped at the card's bottom edge, so a multi-day event runs off it.

`@expo/ui` has no `GeometryReader`, so layout is fixed-point throughout: an
`HStack` of a fixed-width label column beside a `ZStack` of gridlines and
blocks, positioned with `offset`. Overlapping events split into equal-width
columns computed in JavaScript rather than measured.

### Structure

Two files, so the testable half is separable from the half that is not:

- `modules/event-list/timeline.ts` — pure. Window bounds, event-to-offset, and
  the column assignment for overlapping events (interval graph colouring).
- `modules/event-list/event-timeline.tsx` — a thin renderer over it.

Each block shows title, location, and start time, reusing the `Label` and
`location.circle` from change 2.

## Testing

The SwiftUI stand-in at `modules/event-list/__tests__/expo-ui-mock.tsx` reduces
every modifier to `{$type, value}`, and no surviving test reads those values
back — the `audit-mocked-tests` merge removed the ones that did. So appearance
is not assertable here, by house convention.

That splits the work cleanly:

- **Jest.** `timeline.ts` in full, test-first: window bounds, positions,
  clipping, and column assignment for overlaps. The gating rules — all-day and
  non-calendar sources draw nothing. The existing behavioural tests for the list
  and detail still pass.
- **Simulator.** Every metric in the Evidence table, the sheet presentation, the
  floating header buttons, and the bottom toolbar. Verified against the
  screenshots rather than asserted in code.

## Risks

A bottom toolbar inside a pageSheet is not a shape this codebase has used, and
the type definitions do not settle whether it renders. This needs checking on
the simulator before the shape is committed to. If it does not render, the
fallback is a prominent button pinned in the body.

Making `/EventDetail` a modal moves it into the blast radius of the open
cold-start-deep-link dismiss bug, where dismissing a deep-linked sheet lands on
`Menus` rather than Home. Every screen affected today is deep-link-only, so no
user can reach it; `/EventDetail` is a screen users open. It still takes a deep
link to trigger, and event deep links do not ship yet, but the margin is
narrower than it was.

## Sequencing

Changes 1 and 2 are one small PR against the list. Changes 3, 4 and 5 rework the
detail screen together and should land as one. Change 6 follows, since it sits
inside the reworked screen.
