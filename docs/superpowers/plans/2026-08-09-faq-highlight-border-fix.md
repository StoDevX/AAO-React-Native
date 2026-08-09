# FAQ Card Highlight-Border Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `FaqCard`'s highlighted-border style, which currently
renders invisibly because `PlatformColor('tintColor')` doesn't resolve
correctly for a `CALayer.borderColor` — replace it with the app's real,
already-used brand accent color.

**Architecture:** `source/views/faqs/index.tsx`'s `cardHighlighted` style
swaps `borderColor: c.tintColor` for the app's `accent` color
(`source/lib/theme.ts`, already `sto.gold`/`#E3A025`, used everywhere
else in the app as its actual brand accent). `modules/colors/platform.ts`'s
`tintColor` export — a `PlatformColor('tintColor')` reference with
exactly one consumer, this one, now removed — is deleted too, so the
same mistake can't recur at a different call site.

**Tech Stack:** React Native `StyleSheet`, `@frogpond/colors`.

**Root cause (already diagnosed):** `UIColor.tintColor`'s dynamic-color
provider resolves relative to the live view hierarchy (the nearest
ancestor view's actual `tintColor` property) rather than purely from
`UITraitCollection` (light/dark mode) the way every other semantic
`PlatformColor` this codebase uses does. When React Native converts a
`PlatformColor` to a static `CGColor` for a `CALayer` property like
`borderColor`, that conversion doesn't carry real view-hierarchy
context, so `tintColor`'s resolution degenerates to something
functionally invisible — confirmed live: `borderWidth: 4` with
`c.tintColor` rendered nothing, the same width with a literal `'red'`
rendered immediately. No `AccentColor.colorset` asset exists in the iOS
project either way, but that's not the actual cause here (a missing
asset would just fall back to system blue — still visible).

---

### Task 1: Replace the broken tint-color reference

**Files:**
- Modify: `source/views/faqs/index.tsx`
- Modify: `modules/colors/platform.ts`

- [ ] **Step 1: Swap the highlighted-border color**

In `source/views/faqs/index.tsx`, replace:

```typescript
import {LoadingView, NoticeView} from '@frogpond/notice'
```

with:

```typescript
import {LoadingView, NoticeView} from '@frogpond/notice'
import {accent} from '../../lib/theme'
```

Replace:

```typescript
	cardHighlighted: {
		borderColor: c.tintColor,
	},
```

with:

```typescript
	cardHighlighted: {
		borderColor: accent,
	},
```

- [ ] **Step 2: Remove the now-dead `tintColor` export**

In `modules/colors/platform.ts`, delete:

```typescript
export const tintColor = PlatformColor('tintColor')
```

(this was the one and only consumer of this export — confirmed via
`grep -rn "\btintColor\b" source modules app`, which after Step 1
returns zero remaining references. Leaving a broken, single-purpose
`PlatformColor` export in a shared colors module invites the same
mistake at a different call site later.)

- [ ] **Step 3: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake before treating it as
real).

- [ ] **Step 4: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then
`APP_VARIANT=development mise run ios`, in the FOREGROUND, genuinely
waited on to completion.

Reach a highlighted FAQ card via a real tap-through (e.g. from the SIS
Balances banner, or the newly-restored home banner if that PR has
landed by the time this is verified) — confirm the tapped card now
shows a visible gold-colored border, distinguishing it from the other,
unhighlighted cards on the same screen. If no real or dev FAQ banner is
reachable to produce a tap-through with a `faqId`, deep-link directly to
`/Faq?faqId=<a-real-id-from-data/faqs.yaml>` as a fallback and say so
explicitly in the report.

Screenshot: the Faq screen with the highlighted card's border visible —
look at it yourself before trusting a report that claims it shows what
it claims.

- [ ] **Step 5: Commit**

```bash
git add source/views/faqs/index.tsx modules/colors/platform.ts
git commit -m "Fix the FAQ card highlight border not rendering

PlatformColor('tintColor') doesn't behave like this module's other
semantic colors: UIColor.tintColor's dynamic provider resolves
relative to the live view hierarchy, not purely UITraitCollection
(light/dark mode) the way label/systemBackground/separator etc. do.
When RN converts a PlatformColor to a static CGColor for a CALayer
property like borderColor, that resolution degenerates to something
functionally invisible -- confirmed live: borderWidth 4 with
c.tintColor rendered nothing, the same width with a literal 'red'
rendered immediately.

Swapped to the app's real, already-used brand accent (source/lib/theme.ts's
accent, sto.gold) instead, and removed the now-fully-dead tintColor
export from modules/colors/platform.ts -- it had exactly one
consumer, this one, so leaving it in place would just invite the
same mistake again at a different call site.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:** N/A — bug fix, no separate design spec (root cause
and fix already diagnosed via live investigation; no genuine design
fork to brainstorm).

**Placeholder scan:** None found.

**Type consistency:** `accent` is already a plain `string`/`ColorValue`-
compatible export from `source/lib/theme.ts`, matching `cardHighlighted`'s
existing `borderColor` field type exactly (it previously held a
`PlatformColor`, itself `ColorValue`-compatible — no type change at the
call site).
