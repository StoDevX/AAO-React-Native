# Restore the home-screen FAQ banner

## Goal

Restore `FaqBannerGroup` (target `FAQ_TARGETS.HOME`) on the live home
screen, `app/(home)/index.tsx`. The legacy, pre-migration home screen
(`source/views/home/index.tsx`, dead code at runtime today) had this
banner; when the home screen was redesigned around `@expo/ui/swift-ui`
during checkpoint 2's scaffold work, the banner was never carried over.
This is a checkpoint-2 follow-up, not a checkpoint-2 regression — the
banner was already absent from the live screen before this session
started.

## Background

`app/(home)/index.tsx` is composed entirely of `@expo/ui/swift-ui`
native components (`Host`, `ScrollView`, `VStack`, `Grid`, `Spacer`) —
there is no plain React Native view anywhere in its render tree today,
including `UnofficialAppNotice`, which looks like a plain RN component
but is actually built from `@expo/ui`'s own `Text`/`ContextMenu`.

`FaqBannerGroup` (`source/views/faqs/banner.tsx`) is a plain React
Native component (`Pressable`/`View`/`Text`), which can't be dropped
directly into a SwiftUI-composed tree. `@expo/ui/swift-ui` exports
`RNHostView`, documented as "Hosts React Native views inside SwiftUI
views" — the officially-supported bridge for exactly this case. The
legacy `source/views/home/index.tsx` already used this exact mechanism
(confirmed by reading the file): `RNHostView matchContents={true}`
wrapping `FaqBannerGroup`, inside the `VStack`, above the `Grid`, with
its own `styles.banner` margins. It's a working, proven construct that
simply never made it into the new file.

One difference from the legacy version: the legacy `FaqBannerGroup`
call had no tap handler at all — `FaqBannerGroup`'s `onPressFaq` prop
didn't exist yet (it was added during this session's Faq group PR).
This restoration adds real interactivity the legacy version never had.

## Design

**Placement:** Inside the existing `VStack`, above the `Grid`, wrapped
in `RNHostView matchContents={true}` — matching the legacy file's
structure exactly. It scrolls with the rest of the content (the
`VStack` is the child of a SwiftUI `ScrollView`), the same as the
legacy version.

**Styling:** Reuse the legacy `styles.banner` margins verbatim
(`marginHorizontal: SCREEN_MARGIN, marginTop: CELL_MARGIN, marginBottom:
CELL_MARGIN / 2`). Both `SCREEN_MARGIN` and `CELL_MARGIN` are already
imported into `app/(home)/index.tsx` from `source/views/home/button`
for the grid's own layout — no new constants needed.

**Interactivity:** `onPressFaq={(faqId) => router.push({pathname:
'/Faq', params: {faqId}})}` — the same pattern already used for SIS
Balances (`source/views/sis/balances.tsx`). `app/(home)/index.tsx`
already has `useRouter()` in scope (used for tile taps), so this is a
plain prop addition, not new plumbing.

**Testing:** No new unit tests. `FaqBannerGroup`'s per-entry
`onPressFaq` binding is already covered (added during the Faq group
PR); this is a new call site of an already-tested component, following
the same pattern as SIS Balances' own (untested-beyond-manual-
verification) call site.

## Out of scope

- The FAQ card highlight-border rendering bug (`c.tintColor` not
  resolving for `borderColor`) — separate, already-diagnosed follow-up,
  tracked and fixed independently.
- Any change to `FaqBannerGroup`, `FaqBanner`, or the Settings-overview
  call site — this is additive, a new consumer only.
