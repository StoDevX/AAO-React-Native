# Home-Screen FAQ Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `FaqBannerGroup` (target `FAQ_TARGETS.HOME`) on the live
home screen, `app/(home)/index.tsx`, using `RNHostView` to bridge the
plain-React-Native banner into the screen's all-`@expo/ui/swift-ui`
composition — matching the legacy `source/views/home/index.tsx`'s
already-proven construct — and wire real tap-through to `/Faq`, which
the legacy version never had.

**Architecture:** One `RNHostView matchContents={true}` wrapping
`FaqBannerGroup`, inserted into the existing `VStack` above the `Grid`,
using the same `styles.banner` margins the legacy file used. `onPressFaq`
pushes to `/Faq` via the `useRouter()` instance the screen already holds
for tile taps.

**Tech Stack:** React Native, expo-router, `@expo/ui/swift-ui`
(`RNHostView`), React Query (via `FaqBannerGroup`'s own internal query).

---

### Task 1: Add the FAQ banner to the home screen

**Files:**
- Modify: `app/(home)/index.tsx`

- [ ] **Step 1: Add the new imports**

In `app/(home)/index.tsx`, replace:

```typescript
import {Grid, Host, ScrollView, Spacer, VStack} from '@expo/ui/swift-ui'
```

with:

```typescript
import {
	Grid,
	Host,
	RNHostView,
	ScrollView,
	Spacer,
	VStack,
} from '@expo/ui/swift-ui'
```

Add, alongside the existing `source/views/home/button` import:

```typescript
import {FaqBannerGroup} from '../../source/views/faqs'
import {FAQ_TARGETS} from '../../source/views/faqs/constants'
```

- [ ] **Step 2: Add the banner's margin style**

Replace:

```typescript
const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
```

with:

```typescript
const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	banner: {
		marginHorizontal: SCREEN_MARGIN,
		marginTop: CELL_MARGIN,
		marginBottom: CELL_MARGIN / 2,
	},
})
```

(`SCREEN_MARGIN`/`CELL_MARGIN` are already imported from
`source/views/home/button` for the grid's own layout — no new constants
needed. This is byte-for-byte the same margin values the legacy
`source/views/home/index.tsx` used for the same banner.)

- [ ] **Step 3: Render the banner above the grid**

Replace:

```typescript
						<Grid horizontalSpacing={CELL_MARGIN} verticalSpacing={CELL_MARGIN}>
```

with:

```typescript
						{/* FaqBannerGroup is still React Native, so it has to be hosted
						    back into SwiftUI to scroll with the rest of the content --
						    same construct the legacy source/views/home/index.tsx used. */}
						<RNHostView matchContents={true}>
							<FaqBannerGroup
								onPressFaq={(faqId) =>
									router.push({pathname: '/Faq', params: {faqId}})
								}
								style={styles.banner}
								target={FAQ_TARGETS.HOME}
							/>
						</RNHostView>

						<Grid horizontalSpacing={CELL_MARGIN} verticalSpacing={CELL_MARGIN}>
```

(`router` is already in scope — `HomePage` already calls `useRouter()`
for tile taps.)

- [ ] **Step 4: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake before treating it as
real).

- [ ] **Step 5: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then
`APP_VARIANT=development mise run ios`, in the FOREGROUND, genuinely
waited on to completion.

Expected, via real taps through the running app:

- Home screen shows the FAQ banner above the tile grid (only if a real
  FAQ entry currently targets `HOME` in `data/faqs.yaml` — if none does
  today, `FaqBannerGroup` correctly renders nothing, and this step
  should be verified via the dev-banner mechanism instead: check
  `source/views/faqs/dev-banner-store.ts` for how to enable a dev banner
  targeting `HOME` for this verification, or note in the report that no
  real or dev banner was available to visually confirm placement, and
  why).
- If a banner is visible: scrolling the home screen scrolls the banner
  away with the grid (it's inside the same `VStack`/`ScrollView`, not
  pinned).
- Tapping the banner (not its dismiss ×, if dismissable) pushes to a
  screen titled "FAQs" showing the FAQ list. Back button returns to the
  home screen correctly, with all tiles still present and unaffected.
- Confirm no visual regression to the tile grid itself — same tiles,
  same layout, same spacing as before this change.

Screenshot: the home screen showing the banner above the grid, and the
Faq screen reached by tapping it — look at each yourself before trusting
a report that claims they show what they claim.

- [ ] **Step 6: Commit**

```bash
git add app/\(home\)/index.tsx
git commit -m "Restore the FAQ banner on the home screen

Checkpoint-2 follow-up: source/views/home/index.tsx (the legacy,
now-dead home screen) had this banner; when the home screen was
redesigned around @expo/ui/swift-ui during checkpoint 2's scaffold
work, it was never carried over to app/(home)/index.tsx.

RNHostView (the officially-supported bridge for hosting a plain
React Native view inside a SwiftUI-composed tree) wraps
FaqBannerGroup the same way the legacy file already did -- a
working, proven construct, just never ported. Unlike the legacy
version, this wires real tap-through to /Faq via the screen's
existing useRouter() instance; the legacy FaqBannerGroup call
predates FaqBannerGroup's onPressFaq prop entirely, so it was never
interactive even before this migration.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:** Placement (above grid, scrolls with content) — Step
3. Styling (legacy margins reused) — Step 2. Interactivity (`onPressFaq`
→ `/Faq`) — Step 3. No new tests needed, per the spec's own "Testing"
section — confirmed, none added. Out-of-scope items (highlight-border
bug, `FaqBannerGroup`/`FaqBanner` internals, Settings-overview call
site) — untouched, no task references them.

**Placeholder scan:** None found.

**Type consistency:** `onPressFaq: (faqId: string) => void` matches
`FaqBannerGroup`'s existing prop signature (`source/views/faqs/banner.tsx`,
added in the Faq group PR) exactly — no new type introduced.
