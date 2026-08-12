# expo-router checkpoint 4, PR 8: SettingsRoot + entry point

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Settings hub screen (`SettingsRoot`) and give it a
real entry point -- a gear-icon header button on the live home screen.
This is the capstone PR of checkpoint 4's 8-PR stack: every screen
built in PRs 1-7 has been individually correct but fully unreachable
from the live app; this PR connects them.

**Architecture:** `source/views/settings/screens/overview/index.tsx`
(`SettingsView`) is a pure composition of five sub-sections
(`CredentialsLoginSection`, `SupportSection`, `IconSettingsView`,
`MiscellanySection`, and dev-only `DeveloperSection`) and never calls
`useNavigation`/`useRoute` itself -- it needs no changes. Three of its
sub-sections do navigate: `developer.tsx`, `support.tsx`, and
`miscellany.tsx`. All three currently mix same-stack targets (other
Settings screens, e.g. `Credits`, `APITest`) with cross-group targets
(`ComponentLibrary`, a whole other top-level modal group; `Faq`, a
screen inside `(home)`) through a single `navigation.navigate(literal)`
call style. Under expo-router that distinction matters --
`.navigate(name)` only resolves siblings within the CURRENT stack --
so this PR standardizes all of them on `useRouter().push('/Path')`,
which works identically for same-stack and cross-group targets and
needs no typed-generic dance. This is a deliberate simplification, not
a strict single-file mechanical port.

One bug fix, cheaply caught: `developer.tsx`'s Debug row currently
calls `navigation.navigate(DebugKey, {keyPath: ['Root']})` -- a
`keyPath: ['Root']` that only ever "worked" because the LEGACY
`DebugRootView` ignored keyPath entirely (checkpoint 4 PR 6's own
documented bug #1). Now that PR 6 shipped real keyPath-based slicing,
literally porting this call would try to slice into a `'Root'` key
that doesn't exist in the real Redux state, showing `undefined`
instead of the actual top-level state. This PR fixes it by pushing to
the bare `/Debug` root instead.

`app/(settings)/SettingsRoot.tsx` is named after itself, not
`index.tsx` -- `(settings)` is a top-level route group (a sibling of
`(home)` and `(component-library)`, not nested under either), so an
`index.tsx` there would silently collide with `/`, the exact bug this
same session already found and fixed in `(component-library)`
(tracked in project memory).

## Global Constraints

- Branch `expo-router-settings-root`, stacked on
  `expo-router-component-library` (PR #7703).
- iOS only. Never bypass the pre-commit hook. No `any`.
- `source/views/settings/screens/overview/index.tsx` (`SettingsView`)
  is NOT touched -- it has no navigation dependency to remove.
- `source/views/settings/screens/overview/login-credentials.tsx`,
  `change-icon.tsx`, `server-url.tsx` are NOT touched -- confirmed
  during investigation to have no react-navigation dependency.
- `source/views/settings/screens/overview/report-problem/gate.ts` is
  NOT touched -- its `openReportProblem(navigate: () => void)` signature
  is already navigation-agnostic; only its CALLER in `support.tsx`
  changes what it passes in.
- `app/(settings)/_layout.tsx` is NOT touched -- `SettingsNavigationOptions`
  has no `presentation`/`gestureEnabled` flags, so (matching
  `APITest`/`BonAppPicker`/`BannerBuilder`'s precedent) no parent
  registration is needed.
- This is the PR that makes Settings reachable -- unlike every prior
  PR in this stack, manual verification here means tapping the real
  gear icon on the real home screen, not just deep-linking.

---

### Task 1: Convert the three navigating sub-sections to `useRouter`

**Files:**
- Modify: `source/views/settings/screens/overview/developer.tsx`
- Modify: `source/views/settings/screens/overview/support.tsx`
- Modify: `source/views/settings/screens/overview/miscellany.tsx`

**Interfaces:**
- Produces: no exported signature changes -- `DeveloperSection`,
  `SupportSection`, `MiscellanySection` all keep their existing
  `(): React.ReactNode` / `(): React.ReactElement` signatures, unchanged
  from `source/views/settings/screens/overview/index.tsx`'s point of
  view.

- [ ] **Step 1: Convert `developer.tsx`**

Replace the full contents of
`source/views/settings/screens/overview/developer.tsx` with:

```tsx
import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {Alert} from 'react-native'
import {Section} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'
import {useIsDevMode} from '../../../../lib/use-is-dev-mode'
import {ServerUrlSection} from './server-url'
import {ActionRow, NavigationRow} from '../../components/rows'

export const DeveloperSection = (): React.ReactElement => {
	let router = useRouter()
	const isDev = useIsDevMode()

	const onComponentsButton = () => router.push('/ComponentLibrary')
	const onAPIButton = () => router.push('/APITest')
	const onBonAppButton = () => router.push('/BonAppPicker')
	const onBannerBuilderButton = () => router.push('/BannerBuilder')
	const onDebugButton = () => router.push('/Debug')
	const onNetworkLoggerButton = () => router.push('/NetworkLogger')
	const sendSentryMessage = () => {
		Sentry.captureMessage('A Sentry Message', {level: 'info'})
		showSentryAlert()
	}
	const sendSentryException = () => {
		Sentry.captureException(new Error('Debug Exception'))
		showSentryAlert()
	}
	const showSentryAlert = () => {
		if (isDev) {
			Alert.alert(
				'Sentry button pressed',
				'Nothing will appear in the dashboard during development.',
			)
		} else {
			Alert.alert(
				'Sent an event to Sentry.',
				'The dashboard should show a new event since this is not development.',
			)
		}
	}

	return (
		<>
			<Section title="Developer">
				<NavigationRow onPress={onComponentsButton} title="Components" />
				<NavigationRow onPress={onAPIButton} title="API Tester" />
				<NavigationRow onPress={onBonAppButton} title="Bon Appetit Picker" />
				<NavigationRow onPress={onBannerBuilderButton} title="Banner Builder" />
				<NavigationRow onPress={onDebugButton} title="Debug" />
				<NavigationRow onPress={onNetworkLoggerButton} title="Network Logger" />
				<ActionRow onPress={sendSentryMessage} title="Send a Sentry Message" />
				<ActionRow
					onPress={sendSentryException}
					title="Send a Sentry Exception"
				/>
			</Section>

			<ServerUrlSection />
		</>
	)
}
```

(`ComponentLibrary` targets `/ComponentLibrary` -- the cross-group
route named in checkpoint 4 PR 7's own fix commit, not
`/(component-library)` or a bare `/`. `Debug` targets the bare
`/Debug` root -- the fixed version of the old broken
`{keyPath: ['Root']}` call, per this plan's own header. `APITest`,
`BonAppPicker`, `BannerBuilder`, `NetworkLogger` are same-stack
`(settings)` screens; `router.push` resolves them identically to
`.navigate()` would have, since none of these calls ever need to reuse
an already-mounted instance.)

- [ ] **Step 2: Convert `support.tsx`**

Replace the full contents of
`source/views/settings/screens/overview/support.tsx` with:

```tsx
import * as React from 'react'
import {Alert} from 'react-native'
import {LabeledContent, Section, Text} from '@expo/ui/swift-ui'
import {sendEmail} from '../../../../components/send-email'
import * as Application from 'expo-application'
import * as Device from 'expo-device'
import {refreshApp} from '../../../../lib/refresh'
import {useRouter} from 'expo-router'
import {formatVersion} from './version'
import {ActionRow, NavigationRow} from '../../components/rows'
import {openReportProblem} from './report-problem/gate'

const getDeviceInfo = () => `

----- Please do not edit below here -----
${Device.brand} ${Device.modelName}
${Device.modelId}
${Device.osName} ${Device.osVersion}
${Application.nativeApplicationVersion}.${Application.nativeBuildVersion}
`

export const openEmail = (): void => {
	sendEmail({
		to: ['allaboutolaf@frogpond.tech'],
		subject: 'Support: All About Olaf',
		body: getDeviceInfo(),
	})
}

const getVersion = () =>
	formatVersion(
		Application.nativeApplicationVersion,
		Application.nativeBuildVersion,
	)

export const SupportSection = (): React.ReactNode => {
	let router = useRouter()

	let onResetButton = () => {
		Alert.alert(
			'Reset Everything',
			'Are you sure you want to clear everything?',
			[
				{text: 'Nope!', style: 'cancel'},
				{
					text: 'Reset it!',
					style: 'destructive',
					onPress: () => refreshApp(),
				},
			],
		)
	}

	let onReportProblem = () =>
		openReportProblem(() => router.push('/ReportProblem'))

	return (
		<Section title="Support">
			<NavigationRow onPress={() => router.push('/Faq')} title="FAQs" />
			<ActionRow onPress={openEmail} title="Email Us" />
			<NavigationRow onPress={onReportProblem} title="Report a Problem" />
			<ActionRow onPress={onResetButton} title="Reset Everything" />
			<LabeledContent label="Version">
				<Text>{getVersion()}</Text>
			</LabeledContent>
		</Section>
	)
}
```

(`Faq` targets `/Faq`, a screen inside the `(home)` group -- a
cross-group push, same reasoning as `ComponentLibrary` above.
`ReportProblem` is a same-stack `(settings)` screen. `gate.ts`'s
`openReportProblem(navigate: () => void)` signature is untouched --
this is the only file that changes what it passes in.)

- [ ] **Step 3: Convert `miscellany.tsx`**

Replace the full contents of
`source/views/settings/screens/overview/miscellany.tsx` with:

```tsx
import * as React from 'react'
import {Section, Toggle} from '@expo/ui/swift-ui'
import {trackedOpenUrl} from '@frogpond/open-url'
import {GH_BASE_URL} from '../../../../lib/constants'
import * as storage from '../../../../lib/storage'
import {useRouter} from 'expo-router'
import {ActionRow, NavigationRow} from '../../components/rows'

export let MiscellanySection = (): React.ReactNode => {
	let router = useRouter()

	let onCreditsButton = () => router.push('/Credits')
	let onPrivacyButton = () => router.push('/Privacy')
	let onLegalButton = () => router.push('/Legal')
	let onSourceButton = () =>
		trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})

	let [openInApplinkPreference, setOpenInAppLinkPreference] =
		React.useState(true)

	const handleOpenLinkOnChange = async (preference: boolean) => {
		await storage.setLinkPreference(preference)
		setOpenInAppLinkPreference(preference)
	}

	React.useEffect(() => {
		async function loadPreference() {
			setOpenInAppLinkPreference(await storage.getInAppLinkPreference())
		}

		loadPreference()
	}, [])

	return (
		<Section title="Miscellany">
			<Toggle
				isOn={openInApplinkPreference}
				label="Open links in-app"
				onIsOnChange={handleOpenLinkOnChange}
			/>
			<NavigationRow onPress={onCreditsButton} title="Credits" />
			<NavigationRow onPress={onPrivacyButton} title="Privacy Policy" />
			<NavigationRow onPress={onLegalButton} title="Legal" />
			<ActionRow onPress={onSourceButton} title="Contributing" />
		</Section>
	)
}
```

(All three targets -- `Credits`, `Privacy`, `Legal` -- are same-stack
`(settings)` screens.)

- [ ] **Step 4: Verify**

Run: `mise run tsc` -- expect 0 errors.
Run: `mise run lint` -- expect clean.
Run: `mise run test` -- expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake -- e.g.
`source/views/faqs/__tests__/banner.test.tsx`'s dismiss-banner test is a
known, previously-documented flake in this repo -- before treating it
as real).

- [ ] **Step 5: Commit**

```bash
git add source/views/settings/screens/overview/developer.tsx source/views/settings/screens/overview/support.tsx source/views/settings/screens/overview/miscellany.tsx
git commit -m "Convert Settings overview sub-sections to expo-router

Eighth and final PR of checkpoint 4's 8-PR stack, Task 1 of 2.
developer.tsx, support.tsx, and miscellany.tsx all mixed same-stack
Settings targets with cross-group targets (ComponentLibrary, a whole
other top-level modal group; Faq, a screen inside (home)) through a
single navigation.navigate(literal) call style. Standardized all of
them on useRouter().push('/Path'), which resolves same-stack and
cross-group targets identically and needs no typed-generic dance --
unlike .navigate(name), which only resolves siblings within the
current stack.

Also fixes a real bug: developer.tsx's Debug row called
navigation.navigate(DebugKey, {keyPath: ['Root']}), which only ever
'worked' because the legacy DebugRootView ignored keyPath entirely
(checkpoint 4 PR 6's own documented bug #1). Now that PR 6 ships real
keyPath-based slicing, that call would have tried to slice into a
nonexistent 'Root' key. Fixed to push the bare /Debug root instead.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Wire the SettingsRoot route and the home screen's entry point

**Files:**
- Create: `app/(settings)/SettingsRoot.tsx`
- Modify: `modules/navigation-buttons/open-settings.tsx`
- Modify: `app/(home)/index.tsx`

**Interfaces:**
- Consumes: `SettingsView`, `SettingsNavigationOptions` (unchanged
  barrel-export names) from `source/views/settings`; `OpenSettingsButton`
  from `@frogpond/navigation-buttons`.
- Produces: `/SettingsRoot` -- the Settings modal group's actual entry
  screen, reachable for the first time via a real header button on
  `/` (the live home screen).

- [ ] **Step 1: Create the SettingsRoot route**

Create `app/(settings)/SettingsRoot.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {SettingsNavigationOptions, SettingsView} from '../../source/views/settings'

export default function SettingsRootPage(): React.ReactNode {
	return (
		<>
			{/* SettingsNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					SettingsNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<SettingsView />
		</>
	)
}
```

(Named `SettingsRoot.tsx`, not `index.tsx` -- `(settings)` is a
top-level route group, and an `index.tsx` there would silently claim
the bare `/` path, colliding with `(home)/index.tsx`. This is the
exact bug checkpoint 4 PR 7 hit and fixed for `(component-library)`;
this file avoids it from the start.)

- [ ] **Step 2: Repoint `OpenSettingsButton` at the new route**

In `modules/navigation-buttons/open-settings.tsx`, replace:

```tsx
import * as React from 'react'
import {Touchable} from '@frogpond/touchable'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import type {NavigationProp} from '@react-navigation/native'
import {useNavigation} from 'expo-router'
import type {NativeStackHeaderRightProps} from '@react-navigation/native-stack'
import type {LegacyRootParamList} from '../../source/navigation/types'

export function OpenSettingsButton(
	_props: NativeStackHeaderRightProps,
): React.ReactNode {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	return (
		<Touchable
			accessibilityLabel="Open Settings"
			accessibilityRole="button"
			accessible={true}
			highlight={false}
			onPress={() => navigation.navigate('Settings')}
			style={commonStyles.button}
			testID="button-open-settings"
		>
			<Icon
				name="settings"
				style={[rightButtonStyles.icon, {color: c.label}]}
			/>
		</Touchable>
	)
}
```

with:

```tsx
import * as React from 'react'
import {Touchable} from '@frogpond/touchable'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import {useRouter} from 'expo-router'
import type {NativeStackHeaderRightProps} from '@react-navigation/native-stack'

export function OpenSettingsButton(
	_props: NativeStackHeaderRightProps,
): React.ReactNode {
	let router = useRouter()

	return (
		<Touchable
			accessibilityLabel="Open Settings"
			accessibilityRole="button"
			accessible={true}
			highlight={false}
			onPress={() => router.push('/SettingsRoot')}
			style={commonStyles.button}
			testID="button-open-settings"
		>
			<Icon
				name="settings"
				style={[rightButtonStyles.icon, {color: c.label}]}
			/>
		</Touchable>
	)
}
```

(`OpenSettingsButton` is currently used ONLY by the dead, unreachable
`source/views/home/index.tsx` -- confirmed via repo-wide grep -- so
changing its behavior is safe. Its `_props` parameter stays required
and unused, matching its original signature exactly, since the live
home screen's `headerRight` callback still passes real
`NativeStackHeaderRightProps` through.)

- [ ] **Step 3: Wire the gear icon into the live home screen's header**

In `app/(home)/index.tsx`, add the import:

```tsx
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
```

(alongside the existing `import {openUrl} from '@frogpond/open-url'`
line, or wherever fits the existing import grouping.)

Replace:

```tsx
			<Stack.Screen
				options={{
					title: 'All About Olaf',
					contentStyle: {backgroundColor: PlatformColor('systemBackground')},
					headerShadowVisible: false,
					headerLargeTitleEnabled: true,
					headerTransparent: true,
				}}
			/>
```

with:

```tsx
			<Stack.Screen
				options={{
					title: 'All About Olaf',
					contentStyle: {backgroundColor: PlatformColor('systemBackground')},
					headerShadowVisible: false,
					headerLargeTitleEnabled: true,
					headerTransparent: true,
					headerRight: (props) => <OpenSettingsButton {...props} />,
				}}
			/>
```

(matches the dead legacy `source/views/home/index.tsx`'s own
`headerRight: (props) => <OpenSettingsButton {...props} />` usage
exactly -- same component, same prop-forwarding, just relocated to the
live file and pointed at the new route.)

- [ ] **Step 4: Verify**

Run: `mise run tsc` -- expect 0 errors.
Run: `mise run lint` -- expect clean.
Run: `mise run test` -- expect the same pass/fail counts as Task 1's
verification.

- [ ] **Step 5: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then boot the app in
the FOREGROUND, genuinely waited on to completion.

Unlike every prior PR in this stack, this is the first PR where a REAL
user path exists: launch the app fresh, land on the real home screen,
and confirm a gear icon now appears in the header (top-right,
alongside/near the large title). Tap it -- expect the Settings modal
sheet to slide up, landing on the real `SettingsRoot` screen (title
"Settings", a "Done"/close button in the header, and all five sections
visible: the FAQ banner slot, St. Olaf Login, Support, App Icon,
Miscellany, and -- if dev mode is on -- Developer).

Tap through at least three of the following to confirm real
end-to-end navigation, not just that the root screen renders:
- Support section -> "FAQs" -> lands on the real Faq screen (a
  cross-group push, the one most likely to reveal a routing mistake)
- Miscellany section -> "Credits" -> lands on the Credits screen
- (if dev mode is on) Developer section -> "Debug" -> lands on the
  Debug root screen showing genuine top-level Redux state keys (NOT a
  slice for a nonexistent "Root" key -- this is the specific bug this
  PR fixed)
- (if dev mode is on) Developer section -> "Components" -> lands on
  the Component Library root (a cross-group push into a DIFFERENT
  modal group)

Use ONLY `xcrun simctl io booted screenshot` for screenshots -- do NOT
use unscoped `screencapture` or any desktop-level GUI automation
tooling on this machine (see project memory on this). Tapping through
this manual flow requires real touch input on the simulator; if
`xcrun simctl` alone cannot drive taps and no safe automation path
exists, that's an acceptable, honestly-disclosed limitation for THIS
step specifically -- fall back to confirming via direct deep links to
`/SettingsRoot`, `/Faq`, `/Credits`, `/Debug`, and `/ComponentLibrary`
individually instead, and note in the report that the real tap-driven
flow (gear icon -> Settings -> sub-screen) could not be independently
confirmed end-to-end, only each hop's destination route in isolation.

Screenshot the home screen with the visible gear icon, and the
SettingsRoot screen itself -- look at them yourself before trusting a
report that claims what they show.

- [ ] **Step 6: Commit**

```bash
git add app/\(settings\)/SettingsRoot.tsx modules/navigation-buttons/open-settings.tsx app/\(home\)/index.tsx
git commit -m "Wire the SettingsRoot route and the home screen's entry point

Eighth and final PR of checkpoint 4's 8-PR stack, Task 2 of 2. Makes
Settings reachable from the live app for the first time -- every
screen built across this whole 8-PR stack has been individually
correct but fully unreachable until now.

app/(settings)/SettingsRoot.tsx is named after itself, not index.tsx --
(settings) is a top-level route group, and an index.tsx there would
silently claim the bare / path, the exact bug this stack's own PR 7
hit and fixed for (component-library).

OpenSettingsButton (modules/navigation-buttons/open-settings.tsx) is
repointed from the legacy navigation.navigate('Settings') to
router.push('/SettingsRoot') -- it was previously used only by the
dead, unreachable source/views/home/index.tsx, so this is a safe,
self-contained change. The live app/(home)/index.tsx now renders it as
a real headerRight button, matching the dead file's own
headerRight: (props) => <OpenSettingsButton {...props} /> usage
exactly, just relocated to the live screen.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets`
to upload the screenshots and post them as a PR comment. Do this
BEFORE deleting the SDD workspace that holds them.

---

## Self-Review

**Spec coverage:** the design doc's PR-8 slot ("SettingsRoot + gear-icon
entry point on `app/(home)/index.tsx` -- the PR that makes Settings
actually reachable") is covered exactly by Task 2; Task 1 is the
necessary prerequisite (the sub-sections SettingsRoot composes must
navigate correctly before SettingsRoot itself is worth wiring up).

**Placeholder scan:** none found.

**Type consistency:** `SettingsView`/`SettingsNavigationOptions` used
with their existing barrel-export names, matching
`source/views/settings/index.ts`. Every `router.push('/X')` target
string in Task 1 matches an actual, already-existing route file from
PRs 1-7 (`/ComponentLibrary`, `/APITest`, `/BonAppPicker`,
`/BannerBuilder`, `/Debug`, `/NetworkLogger`, `/Faq`, `/ReportProblem`,
`/Credits`, `/Privacy`, `/Legal`) -- none of them are invented.
`/SettingsRoot` in Task 2 matches Task 2's own Step 1 file exactly.

## Followup (not this PR's scope)

- The still-open Menus-default dismiss bug
  (`expo-router-modal-dismiss-lands-on-menus.md`) becomes directly
  user-visible for the first time once this PR ships, since Settings
  is now reachable via a real tap rather than only deep links. Worth
  re-testing against a REAL tap-driven dismiss (not just a deep-link
  dismiss) once this PR lands, since the two paths might not be
  identical -- and this should be fixed before checkpoint 6 (deep
  linking) regardless.
- `source/views/settings/screens/overview/login-credentials.tsx`
  (`CredentialsLoginSection`) was not investigated in detail during
  this PR's planning since it was confirmed to have no navigation
  dependency -- worth a quick read before checkpoint 7 deletes
  `source/navigation/` entirely, in case it references anything from
  that tree indirectly.
