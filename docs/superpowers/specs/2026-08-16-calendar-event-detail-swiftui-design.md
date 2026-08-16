# Calendar event detail in SwiftUI

## Why

The event detail screen renders every field through `SelectableCell`, a
read-only multiline `TextInput` standing in for a label. That cell exists only
to make text selectable, and it costs us a fake scroll view per field: the
accessibility tree carries a "Vertical scroll bar, 1 page" element for each one.

Rebuilding the screen on `@expo/ui/swift-ui` removes the stand-in and lets the
layout follow the iOS 27 Calendar event detail, which leads with the event's
title and date range rather than spelling out an `EVENT` and a `TIME` row.

## What it looks like

A `Host` wrapping a `Form`, following `app/(settings)/SettingsRoot.tsx`.

| Region | Content |
| --- | --- |
| Header | An accent bar beside a `Text` of the title in `.title2` bold, with the formatted date range beneath it in `secondaryLabel`. Replaces today's `EVENT` and `TIME` sections. |
| `Section("Location")` | `Text(event.location)` with `textSelection(true)` |
| `Section("Description")` | `Text(event.description)` with `textSelection(true)` |
| `Section("Links")` | One `Link` per entry in `event.links` |
| `Section` | A `Button` labelled "Add to calendar", with the status message as the section footer |
| Footer | The existing "Powered by…" `ListFooter`, inside an `RNHostView` |

The accent bar takes a fixed tint. `EventType` carries no per-event colour, and
the list's `Bar` is `c.separator` rather than anything event-specific.

Sections whose content is empty do not render, matching `MaybeSection` today.
`event.links` is frequently empty, so the `Links` section is usually absent.

### Not included

The reference screen's day-timeline strip and its map thumbnail of the location.
We have neither the surrounding-events query nor geocoding, and inventing them is
a much larger piece of work than this rebuild.

## Boundaries

`EventDetail` stays the one presentational component in `modules/event-list/`,
keeping its `{event, poweredBy}` props. `app/(home)/EventDetail.tsx` and the four
sources that reach it — `stolaf`, `northfield`, `ksto-schedule`, `krlx-schedule`
— are untouched.

Two pieces split out of it so each can be read and tested alone:

- `event-detail-header.tsx` — accent bar, title, date range. Takes `{title, times}`, both already strings, so it needs no `moment` and no `EventType`.
- `event-detail-view.tsx` — the `Host`/`Form` composition.

`AddToCalendar` is already headless: it calls a `render` prop with
`{message, disabled, onPress}`, so a SwiftUI `Button` substitutes for the
current `ButtonCell` with no change to the module.

## The navigation title

The route currently sets `Stack.Title` to the event's title, which the new header
also shows. The route instead sets a short calendar name — `St. Olaf`,
`Northfield`, `KSTO`, `KRLX` — keyed off the `source` param it already reads,
alongside the existing `POWERED_BY` map.

This stays in the route rather than in `EventDetail`, because `source` is a
routing concern and the component only ever receives `poweredBy`.

## Data detectors

The screen loses them. `@expo/ui`'s `Text` exposes only `markdownEnabled`, and
its `Link` needs an explicit `destination`; neither runs `NSDataDetector`.
SwiftUI itself has no `dataDetectorTypes` equivalent — the usual workaround
wraps `UITextView` in a `UIViewRepresentable`, which is not something `@expo/ui`
can express from JavaScript.

So dates in this screen stop offering "Add to Calendar" and "Show in Calendar"
from a long press. The explicit "Add to calendar" button covers the main case,
and the new `Links` section makes event URLs tappable, which they are not today.

`SelectableCell` keeps its detectors for CourseDetail, JobDetail and StudentOrgs.

## Testing

Jest, following `source/features/map/__tests__/expo-ui-mock.tsx`: `@expo/ui/swift-ui`
cannot load under Jest, since importing it reaches expo-modules-core's native
bindings. The existing mock is deliberately narrow, exporting only what the map
sheets import, so it needs extending for `Form`, `Section`, `Link` and the
modifiers this screen uses.

Cover:

- the header renders the title and the date range
- a section is absent when its field is empty
- `Links` renders one row per entry, and is absent when `links` is empty
- "Add to calendar" calls the `onPress` that `AddToCalendar` supplies, and shows its message

`uitests/ModuleCalendarTests.swift` needs its element queries revisited. Ported
rows become buttons rather than text views, and `Form` builds its rows lazily, so
anything below the fold is absent from the tree rather than merely offscreen.
Dump the real tree before rewriting the assertions rather than guessing at them.

## Risks

- **Text truncation.** `Form` rows size differently from the current table view; a long description may clip where it previously wrapped. Check with a real multi-paragraph event.
- **Dynamic Type.** The settings icon tile still does not scale, so `@expo/ui` layout at large sizes deserves a look rather than an assumption.
- **`RNHostView` for the footer.** `SettingsRoot` uses it for the FAQ banner, so the pattern is proven, but it needs `listRowInsets` and `listRowBackground` zeroed to avoid a stray inset.
