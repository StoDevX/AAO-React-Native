# expo-router checkpoint 2, group PR 15: Faq

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Faq" screen and, with it, `FaqBanner`'s real
tap-through — which the SIS group PR had to turn into a no-op fallback
because this route didn't exist yet. Fifteenth and final group PR in
checkpoint 2's stack. Faq has no home-grid tile of its own (it's reached
only by tapping a `FaqBanner`); the previous 14 groups have already
migrated every screen that has one.

**Faq is registered twice, and only one registration is this plan's
scope.** `source/navigation/routes.tsx` has `faqs.View`/
`faqs.NavigationOptions` mounted in two completely separate legacy
navigator trees: once in `HomeStackScreens` (dead code today, same as
every other already-migrated group's old registration), and once in
`SettingsStackScreens` (very much alive — Settings hasn't been migrated
yet, and its own migration is a future checkpoint entirely outside this
one). Both registrations reference the exact same component and options
object, but they're two independent `Stack.Screen` entries in two
independent `createNativeStackNavigator` trees — removing the
`HomeStackScreens` one doesn't touch the `SettingsStackScreens` one in
any way, and this plan does exactly that: delete one `Stack.Screen`,
keep the `import * as faqs from '../views/faqs'` line (still needed by
the Settings registration), leave `SettingsStackScreens` and everything
under `source/views/settings/` completely untouched.

**`FaqBannerGroup` needs new prop plumbing, not just a route.**
`FaqBanner`'s no-op fallback (added in the SIS group PR) only covers
`FaqBanner` itself — but every real consumer renders through
`FaqBannerGroup`, which today has no way to pass a tap handler down to
the `FaqBanner` instances it builds internally (`GroupProps` is just
`{target, style}`). This plan adds an optional `onPressFaq?: (faqId:
string) => void` prop to `FaqBannerGroup`, forwarded to each
`FaqBanner`'s `onPressOverride` — restoring exactly the same shape of
control this migration has used everywhere else (a plain callback prop,
not a `useNavigation()` call baked into the shared component).

**Only one of `FaqBannerGroup`'s three consumers is in scope.**
`FAQ_TARGETS` has three values — `HOME`, `SIS`, `SETTINGS_ROOT` — each
with its own `FaqBannerGroup` call site:

- `source/views/sis/balances.tsx` (target `SIS`) is live under expo-router
  today — this is the exact "Login and Balances Unavailable" banner
  screenshotted in the SIS group PR's own verification, non-interactive
  since that PR shipped. **In scope**: wire it to `router.push({pathname:
  '/Faq', params: {faqId}})`.
- `source/views/settings/screens/overview/index.tsx` (target
  `SETTINGS_ROOT`) lives entirely inside the still-legacy Settings tree.
  **Out of scope** — Settings isn't reachable from expo-router at all yet
  (a separate, pre-existing gap this checkpoint doesn't touch), and its
  own migration will restore this the same way.
- `source/views/home/index.tsx` (target `HOME`) is the **legacy, dead**
  home screen — `app/(home)/index.tsx`, the real one, never had a
  `FaqBannerGroup` at all. It's not that this migration broke it; the
  home screen's own earlier redesign (an all-`@expo/ui/swift-ui` native
  layout, not a plain React Native `ScrollView`) never carried it over.
  Adding one now means embedding a plain React Native component
  (`FaqBannerGroup` renders `Pressable`/`View`/`Text`) into a screen
  that's otherwise 100% native SwiftUI composition end to end — a real
  UI/layout decision (where does it go relative to the `Host`? does it
  need its own wrapping view outside the SwiftUI tree entirely?), not a
  mechanical "restore what was there." **Out of scope** for this plan;
  worth its own explicit follow-up rather than folding into a checkpoint
  about navigation, not screen design.

## Global Constraints

- Branch `expo-router-home-faq`, stacked on `expo-router-home-calendar`
  (PR #7691).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.
- Do not touch `source/views/settings/`, `SettingsStackScreens`, or the
  `SettingsStack.Screen` Faq registration in `source/navigation/routes.tsx`
  — Settings' migration is a separate, future checkpoint.
- Do not add a `FaqBannerGroup` to `app/(home)/index.tsx` — that's a
  screen-design decision, not a navigation restoration, and belongs in
  its own follow-up.

---

### Task 1: Wire the Faq screen and restore FaqBanner's tap-through

**Files:**
- Modify: `source/views/faqs/index.tsx`
- Modify: `source/views/faqs/banner.tsx`
- Modify: `source/views/sis/balances.tsx`
- Modify: `source/navigation/routes.tsx`
- Create: `app/(home)/Faq.tsx`

**Interfaces:**
- Consumes: `View`/`NavigationOptions` (unchanged export names) from
  `source/views/faqs`; `FaqBannerGroup` (new `onPressFaq?: (faqId:
  string) => void` prop) from `source/views/faqs/banner.tsx`.
- Produces: `/Faq` (flat top-level route, no dynamic segment — `faqId`
  travels as a plain query-string-style param, matching Bus/Reddit/
  Building Hours' precedent for optional string params on a static
  route name).

- [ ] **Step 1: Convert the Faq screen to `useLocalSearchParams`**

In `source/views/faqs/index.tsx`, replace:

```typescript
import {ParamListBase, RouteProp, useRoute} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {faqsOptions, emptyFaqData} from './query'
import {useQuery} from '@tanstack/react-query'
import type {Faq, FaqQueryData} from './types'

type FaqRoute = RouteProp<ParamListBase & {Faq: {faqId?: string}}, 'Faq'>
```

with:

```typescript
import {useLocalSearchParams} from 'expo-router'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {faqsOptions, emptyFaqData} from './query'
import {useQuery} from '@tanstack/react-query'
import type {Faq, FaqQueryData} from './types'
```

Replace:

```typescript
function FaqView(): React.ReactNode {
	let route = useRoute<FaqRoute>()
	let {data, error, isLoading, isError, isRefetching, refetch} =
		useQuery(faqsOptions)
	let faqData: FaqQueryData = data ?? emptyFaqData
	let highlightId = route.params?.faqId
```

with:

```typescript
function FaqView(): React.ReactNode {
	let {faqId: highlightId} = useLocalSearchParams<{faqId?: string}>()
	let {data, error, isLoading, isError, isRefetching, refetch} =
		useQuery(faqsOptions)
	let faqData: FaqQueryData = data ?? emptyFaqData
```

Everything else in the file — `FaqCard`, the loading/error/empty states,
the `NavigationOptions` export (kept, still typed against
`NativeStackNavigationOptions`, cast the same way `More`/`StudentOrgs`
already cast their own static `NavigationOptions` in their `app/`
wrapper) — is unchanged.

- [ ] **Step 2: Add tap-through plumbing to `FaqBannerGroup`**

In `source/views/faqs/banner.tsx`, replace:

```typescript
type GroupProps = {
	target: FaqTarget
	style?: StyleProp<ViewStyle>
}

export function FaqBannerGroup({target, style}: GroupProps): React.ReactNode {
```

with:

```typescript
type GroupProps = {
	target: FaqTarget
	style?: StyleProp<ViewStyle>
	onPressFaq?: (faqId: string) => void
}

export function FaqBannerGroup({
	target,
	style,
	onPressFaq,
}: GroupProps): React.ReactNode {
```

Replace:

```typescript
			{matching.map((entry) => (
				<FaqBanner
					key={entry.id}
					faqId={entry.id}
					style={styles.groupBanner}
					target={target}
				/>
			))}
```

with:

```typescript
			{matching.map((entry) => (
				<FaqBanner
					key={entry.id}
					faqId={entry.id}
					onPressOverride={
						onPressFaq ? () => onPressFaq(entry.id) : undefined
					}
					style={styles.groupBanner}
					target={target}
				/>
			))}
```

(`onPressFaq` is optional and defaults to `undefined` — every existing
`FaqBannerGroup` call site that doesn't pass it, i.e.
`source/views/settings/screens/overview/index.tsx`, keeps its current
non-interactive rendering exactly as-is, matching this plan's stated
scope boundary.)

- [ ] **Step 3: Wire the SIS Balances banner to the real route**

In `source/views/sis/balances.tsx`, replace:

```typescript
import {NoCredentialsError, credentialsOptions} from '../../lib/login'
import {useQuery} from '@tanstack/react-query'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'
```

with:

```typescript
import {useRouter} from 'expo-router'
import {NoCredentialsError, credentialsOptions} from '../../lib/login'
import {useQuery} from '@tanstack/react-query'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'
```

Replace:

```typescript
export const BalancesView = (): React.ReactNode => {
	let {data: username = ''} = useQuery({
```

with:

```typescript
export const BalancesView = (): React.ReactNode => {
	let router = useRouter()

	let {data: username = ''} = useQuery({
```

Replace:

```typescript
			<FaqBannerGroup style={styles.banner} target={FAQ_TARGETS.SIS} />
```

with:

```typescript
			<FaqBannerGroup
				onPressFaq={(faqId) =>
					router.push({pathname: '/Faq', params: {faqId}})
				}
				style={styles.banner}
				target={FAQ_TARGETS.SIS}
			/>
```

- [ ] **Step 4: Remove the dead Home registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the `HomeStackScreens`
`Stack.Group` block:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={faqs.View}
					name="Faq"
					options={faqs.NavigationOptions}
				/>
			</Stack.Group>
```

Leave `import * as faqs from '../views/faqs'` — it's still needed by
`SettingsStackScreens`'s own `Faq` registration a few lines below,
completely untouched. Leave `SettingsStackScreens` itself, and every
other `Stack.Group`/`Stack.Screen` in this file, exactly as they are.

No changes needed to `source/navigation/types.tsx`: `RootViewsParamList.Faq:
FaqRouteParams` is already a plain string-literal key (not a computed
`[faqs.NavigationKey]` the way most other groups' entries were before
their own migrations) — it stays valid as-is, same as `Menus`/`News`/
every other already-migrated group's now-dead-but-still-listed entry in
that same type. `SettingsStackParamList.Faq: FaqRouteParams` is a
completely separate key in a separate type and is untouched regardless.

No changes needed to `source/views/views.ts`: Faq has no `AllViews()`
entry (it's reached only via `FaqBanner`, never as its own home-grid
tile), so there's nothing to un-disable.

- [ ] **Step 5: Create the Faq route**

Create `app/(home)/Faq.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {View as FaqView, NavigationOptions} from '../../source/views/faqs'

export default function FaqPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					NavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<FaqView />
		</>
	)
}
```

(no entry needed in `app/(home)/_layout.tsx` — matches every other
simple, single, self-titled screen's precedent of setting its own header
via this cast rather than a parent-level registration.)

- [ ] **Step 6: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake — see this project's
known `source/views/faqs/__tests__/banner.test.tsx` flake — before
treating it as real; note that this same test file was substantially
rewritten in the SIS group PR to cover `onPressOverride`/the
non-interactive fallback, so a failure there now is more likely a real
regression from this task's `FaqBannerGroup` changes than the old flake
— check carefully before assuming flake).

- [ ] **Step 7: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then
`APP_VARIANT=development mise run ios`, in the FOREGROUND, genuinely
waited on to completion.

Expected, via real taps through the running app:

- Navigate Home → SIS tile → Balances tab. The "Login and Balances
  Unavailable" banner (or whatever real FAQ data is live at test time,
  targeting `SIS`) should now be genuinely tappable — tapping it (not
  its dismiss ×) should push to a screen titled "FAQs" showing the full
  FAQ list, with the tapped entry's card visibly highlighted (a colored
  border, per `FaqCard`'s `isHighlighted` styling) and scrolled into
  view or otherwise identifiable on the list. Confirm the back button
  returns to the Balances tab correctly.
- If real FAQ data isn't reachable in this sandbox (network-dependent,
  same caveat as the rest of this migration), confirm at minimum: the
  banner still renders (or gracefully renders nothing if no FAQ data
  loads), and separately, deep-linking directly to `/Faq` and to
  `/Faq?faqId=<some-real-id-from-data/faqs.yaml>` both render the FAQ
  list correctly (with highlighting in the second case) without
  crashing — note explicitly in the report that this fallback was used
  and why.
- Confirm `source/views/settings/screens/overview/index.tsx`'s own
  `FaqBannerGroup` (target `SETTINGS_ROOT`) is unreachable in this build
  (Settings isn't wired into expo-router yet) — this is expected, not a
  regression to chase down; just don't be surprised by it.

Screenshot: the SIS Balances tab showing the tappable banner, and the
Faq screen reached by tapping it (showing the highlighted card) — look
at each yourself before trusting a report that claims they show what
they claim, the same way you would for any other screenshot in this
process.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 8: Commit**

```bash
git add source/views/faqs/index.tsx source/views/faqs/banner.tsx source/views/sis/balances.tsx source/navigation/routes.tsx app/\(home\)/Faq.tsx
git commit -m "Restore the Faq screen and FaqBanner's tap-through

Fifteenth and final group PR in checkpoint 2's stack. Faq has no
home-grid tile of its own -- it's reached only by tapping a
FaqBanner, so this closes out a follow-up from the SIS group PR,
where FaqBanner's onPress had to become a no-op fallback because
this route didn't exist yet.

FaqBannerGroup gained an onPressFaq prop (forwarded to each
FaqBanner's existing onPressOverride) since the no-op fallback alone
only covered FaqBanner itself -- every real consumer renders through
FaqBannerGroup, which had no way to pass a tap handler down. Only
the SIS Balances banner (the one already live and screenshotted,
non-interactive, in the SIS group PR) is wired up here; the
Settings-overview banner stays untouched since Settings itself isn't
migrated yet, and the home screen's own banner was never ported to
the all-SwiftUI home screen in the first place -- both are
deliberately out of this plan's scope, not regressions it introduces
or is responsible for fixing.

source/navigation/routes.tsx keeps its `import * as faqs` line --
still needed by SettingsStackScreens' own, untouched Faq
registration -- and only the HomeStackScreens copy is removed."
```

- [ ] **Step 9: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
