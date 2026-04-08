# Remove Android Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully remove Android platform support, leaving an iOS-only React Native app.

**Architecture:** Delete the `android/` native project, all `.android.tsx` files, Android fastlane lanes, and Android CI jobs. Simplify all `Platform.OS === 'android'` checks to keep only iOS code paths. Rename `.ios.tsx` files to `.tsx` where paired Android files existed, and update wrapper/barrel imports.

**Tech Stack:** React Native 0.72.9, TypeScript, GitHub Actions, Fastlane

---

### Task 1: Delete the `android/` directory and Android CI/Fastlane files

**Files:**
- Delete: `android/` (entire directory)
- Delete: `.github/workflows/validate-gradle-wrapper.yml`
- Delete: `fastlane/platforms/android.rb`

- [ ] **Step 1: Delete the android directory**

```bash
rm -rf android/
```

- [ ] **Step 2: Delete the Gradle wrapper validation workflow**

```bash
rm .github/workflows/validate-gradle-wrapper.yml
```

- [ ] **Step 3: Delete the Android fastlane platform file**

```bash
rm fastlane/platforms/android.rb
```

- [ ] **Step 4: Commit**

```bash
git add -A android/ .github/workflows/validate-gradle-wrapper.yml fastlane/platforms/android.rb
git commit -m "Delete android/ directory, Gradle validation workflow, and Android fastlane lanes"
```

---

### Task 2: Delete `.android.tsx` files

**Files:**
- Delete: `source/views/directory/detail.android.tsx`
- Delete: `modules/datepicker/datepicker-android.tsx`
- Delete: `modules/event-list/event-detail-android.tsx`
- Delete: `source/views/student-orgs/detail-android.tsx`
- Delete: `source/views/sis/student-work/detail-android.tsx`
- Delete: `source/views/building-hours/detail/schedule-row-android.tsx`
- Delete: `source/views/building-hours/detail/schedule-table-android.tsx`
- Delete: `source/views/building-hours/detail/link-table-android.tsx`

- [ ] **Step 1: Delete all Android platform-specific component files**

```bash
rm source/views/directory/detail.android.tsx
rm modules/datepicker/datepicker-android.tsx
rm modules/event-list/event-detail-android.tsx
rm source/views/student-orgs/detail-android.tsx
rm source/views/sis/student-work/detail-android.tsx
rm source/views/building-hours/detail/schedule-row-android.tsx
rm source/views/building-hours/detail/schedule-table-android.tsx
rm source/views/building-hours/detail/link-table-android.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Delete all .android.tsx platform-specific files"
```

---

### Task 3: Rename `.ios.tsx` files to `.tsx` and rewrite wrapper files

Each pair had a wrapper `.ts` file that used `Platform.OS` to pick between iOS and Android. Now the wrapper just re-exports from the (renamed) iOS file.

**Files:**
- Rename: `source/views/directory/detail.ios.tsx` → `source/views/directory/detail-view.tsx`
- Modify: `source/views/directory/detail.ts` — re-export directly from `./detail-view`
- Rename: `modules/datepicker/datepicker-ios.tsx` → `modules/datepicker/datepicker-view.tsx`
- Modify: `modules/datepicker/datepicker.ts` — re-export directly from `./datepicker-view`
- Rename: `modules/event-list/event-detail-ios.tsx` → `modules/event-list/event-detail-view.tsx`
- Modify: `modules/event-list/event-detail.tsx` — re-export directly from `./event-detail-view`
- Rename: `source/views/student-orgs/detail-ios.tsx` → `source/views/student-orgs/detail-view.tsx`
- Modify: `source/views/student-orgs/detail.ts` — re-export directly from `./detail-view`
- Rename: `source/views/sis/student-work/detail-ios.tsx` → `source/views/sis/student-work/detail-view.tsx`
- Modify: `source/views/sis/student-work/detail.tsx` — re-export directly from `./detail-view`
- Rename: `source/views/building-hours/detail/schedule-row-ios.tsx` → `source/views/building-hours/detail/schedule-row-view.tsx`
- Modify: `source/views/building-hours/detail/schedule-row.ts` — re-export directly from `./schedule-row-view`
- Rename: `source/views/building-hours/detail/schedule-table-ios.tsx` → `source/views/building-hours/detail/schedule-table-view.tsx`
- Modify: `source/views/building-hours/detail/schedule-table.ts` — re-export directly from `./schedule-table-view`
- Rename: `source/views/building-hours/detail/link-table-ios.tsx` → `source/views/building-hours/detail/link-table-view.tsx`
- Modify: `source/views/building-hours/detail/link-table.ts` — re-export directly from `./link-table-view`

Note: We use `-view` suffix to avoid naming collisions with the wrapper file (e.g., `detail.ts` wrapper can't import from `./detail` which would be itself).

- [ ] **Step 1: Rename the iOS files**

```bash
git mv source/views/directory/detail.ios.tsx source/views/directory/detail-view.tsx
git mv modules/datepicker/datepicker-ios.tsx modules/datepicker/datepicker-view.tsx
git mv modules/event-list/event-detail-ios.tsx modules/event-list/event-detail-view.tsx
git mv source/views/student-orgs/detail-ios.tsx source/views/student-orgs/detail-view.tsx
git mv source/views/sis/student-work/detail-ios.tsx source/views/sis/student-work/detail-view.tsx
git mv source/views/building-hours/detail/schedule-row-ios.tsx source/views/building-hours/detail/schedule-row-view.tsx
git mv source/views/building-hours/detail/schedule-table-ios.tsx source/views/building-hours/detail/schedule-table-view.tsx
git mv source/views/building-hours/detail/link-table-ios.tsx source/views/building-hours/detail/link-table-view.tsx
```

- [ ] **Step 2: Rewrite `source/views/directory/detail.ts`**

Replace entire file with:

```typescript
export {DirectoryDetailView, DetailNavigationOptions} from './detail-view'
```

- [ ] **Step 3: Rewrite `modules/datepicker/datepicker.ts`**

Replace entire file with:

```typescript
export {DatePicker} from './datepicker-view'
```

- [ ] **Step 4: Rewrite `modules/event-list/event-detail.tsx`**

Replace entire file with:

```typescript
import {EventType} from '@frogpond/event-type'
import {PoweredBy} from './types'

export {
	EventDetail,
	NavigationOptions as EventDetailNavigationOptions,
} from './event-detail-view'

export const NavigationKey = 'EventDetail' as const
export type ParamList = {event: EventType; poweredBy: PoweredBy}
```

- [ ] **Step 5: Rewrite `source/views/student-orgs/detail.ts`**

Replace entire file with:

```typescript
export {View, NavigationOptions} from './detail-view'
```

- [ ] **Step 6: Rewrite `source/views/sis/student-work/detail.tsx`**

Replace entire file with:

```typescript
export {View, NavigationOptions} from './detail-view'
```

- [ ] **Step 7: Rewrite `source/views/building-hours/detail/schedule-row.ts`**

Replace entire file with:

```typescript
export {ScheduleRow} from './schedule-row-view'
```

- [ ] **Step 8: Rewrite `source/views/building-hours/detail/schedule-table.ts`**

Replace entire file with:

```typescript
export {ScheduleTable} from './schedule-table-view'
```

- [ ] **Step 9: Rewrite `source/views/building-hours/detail/link-table.ts`**

Replace entire file with:

```typescript
export {LinkTable} from './link-table-view'
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Rename .ios.tsx files to .tsx and simplify wrapper re-exports"
```

---

### Task 4: Simplify Platform.OS checks in shared code (batch 1 — style-only files)

These files only use Platform checks for styling. Remove Android branches, keep iOS values.

**Files:**
- Modify: `source/views/transportation/bus/line.tsx`
- Modify: `modules/lists/list-row.tsx`
- Modify: `modules/lists/list-section-header.tsx`
- Modify: `modules/tableview/cells/textfield.tsx`
- Modify: `modules/tableview/cells/toggle.tsx`

- [ ] **Step 1: Simplify `source/views/transportation/bus/line.tsx`**

Remove `Platform` from imports. Replace platform-conditional styles with iOS values:

```typescript
// line 49: paddingVertical: Platform.OS === 'ios' ? 6 : 10,
// becomes:
paddingVertical: 6,

// line 51: borderTopWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
// becomes:
borderTopWidth: StyleSheet.hairlineWidth,

// line 52: borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
// becomes:
borderBottomWidth: StyleSheet.hairlineWidth,

// line 64: fontWeight: Platform.OS === 'ios' ? '500' : '600',
// becomes:
fontWeight: '500',

// line 66: fontFamily: Platform.OS === 'android' ? 'sans-serif-condensed' : undefined,
// remove this line entirely

// line 72: fontFamily: Platform.OS === 'android' ? 'sans-serif-condensed' : undefined,
// remove this line entirely
```

Remove `Platform` from the import on line 5.

- [ ] **Step 2: Simplify `modules/lists/list-row.tsx`**

Remove Android branch from `Platform.select` styles (lines 16-25) — keep iOS values:

```typescript
// Replace Platform.select block with:
paddingVertical: 8,
paddingRight: 8,
```

Remove Android check from arrow (line 61):

```typescript
// Replace:
// arrowPosition === 'none' || Platform.OS === 'android' ? null : (
// With:
arrowPosition === 'none' ? null : (
```

Remove `Platform` from imports.

- [ ] **Step 3: Simplify `modules/lists/list-section-header.tsx`**

Replace all `Platform.select` calls in styles with iOS values:

```typescript
// container (lines 16-28): keep iOS branch
paddingVertical: 6,
paddingRight: 10,

// bold (lines 31-34): keep iOS branch
fontWeight: '500',

// title (lines 38-47): keep iOS branch
fontSize: 16,
color: c.label,

// subtitle (lines 51-61): keep iOS branch
fontSize: 16,
color: c.secondaryLabel,
```

Replace the runtime Platform.OS check (lines 91-109) with just the iOS branch:

```typescript
containerTheme = {
	...containerTheme,
	backgroundColor: c.systemGroupedBackground,
	borderTopWidth: StyleSheet.hairlineWidth,
	borderBottomWidth: StyleSheet.hairlineWidth,
	borderTopColor: c.separator,
	borderBottomColor: c.separator,
}
```

Remove `Platform` from imports.

- [ ] **Step 4: Simplify `modules/tableview/cells/textfield.tsx`**

```typescript
// line 17: marginTop: Platform.OS === 'ios' ? -2 : 0,
// becomes:
marginTop: -2,

// line 28: height: Platform.OS === 'android' ? 65 : 44,
// becomes:
height: 44,
```

Remove `Platform` from imports.

- [ ] **Step 5: Simplify `modules/tableview/cells/toggle.tsx`**

```typescript
// lines 23-26: Replace Platform.select with just iOS value:
trackColor={{
	true: colors.primary,
	false: undefined,
}}
```

Remove `Platform` from imports.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Remove Platform.OS Android branches from style-only files"
```

---

### Task 5: Simplify Platform.OS checks in shared code (batch 2 — behavioral files)

**Files:**
- Modify: `modules/touchable/index.tsx`
- Modify: `source/views/transportation/bus/components/progress-chunk.tsx`
- Modify: `modules/button/index.tsx`
- Modify: `modules/lists/list-separator.tsx`
- Modify: `modules/lists/disclosure-arrow.tsx`
- Modify: `source/views/stoprint/print-jobs.tsx`
- Modify: `modules/constants/index.ts`
- Modify: `source/views/building-hours/report/overview.tsx`

- [ ] **Step 1: Simplify `modules/touchable/index.tsx`**

Replace the Platform.OS branching (lines 41-57) with just the iOS code path:

```typescript
if (highlight) {
	containerAdjustmentStyle = (state) =>
		state.pressed
			? [{backgroundColor: underlayColor}, containerStyle]
			: [{backgroundColor: white}, containerStyle]
} else {
	containerAdjustmentStyle = (state) =>
		state.pressed
			? [{opacity: activeOpacity}, containerStyle]
			: [containerStyle]
}
```

Remove `android_ripple={{borderless}}` prop from the Pressable (line 62).

Remove `Platform` from imports.

- [ ] **Step 2: Simplify `source/views/transportation/bus/components/progress-chunk.tsx`**

Remove `const isAndroid = Platform.OS === 'android'` (line 6).

Replace bar color logic (lines 63-64):

```typescript
// Replace:
// let startBarColor = isAndroid && isFirstChunk ? c.clear : barColor
// let endBarColor = isAndroid && isLastChunk ? c.clear : barColor
// With:
let startBarColor = barColor
let endBarColor = barColor
```

Remove `Platform` from imports on line 3.

- [ ] **Step 3: Simplify `modules/button/index.tsx`**

Replace `Platform.select` in styles (lines 27-30):

```typescript
text: {
	...iOSUIKit.calloutWhiteObject,
},
```

Replace `Platform.select` in inverted styles (lines 39-42):

```typescript
text: {
	...iOSUIKit.calloutObject,
},
```

Replace text rendering (line 79):

```typescript
// Replace:
// {Platform.OS === 'android' ? title.toUpperCase() : title}
// With:
{title}
```

Remove `Platform` from imports. Remove `material` from the `react-native-typography` import.

- [ ] **Step 4: Simplify `modules/lists/list-separator.tsx`**

Remove the Android early-return (lines 19-21):

```typescript
// Delete:
// if (Platform.OS === 'android' && !props.force) {
//   return null
// }
```

Remove `Platform` from imports.

- [ ] **Step 5: Simplify `modules/lists/disclosure-arrow.tsx`**

Remove the Android early-return (lines 21-23):

```typescript
// Delete:
// if (Platform.OS === 'android') {
//   return null
// }
```

Remove `Platform` from imports.

- [ ] **Step 6: Simplify `source/views/stoprint/print-jobs.tsx`**

Replace Platform.OS check (lines 82-85):

```typescript
// Replace:
// let instructions =
//   Platform.OS === 'android'
//     ? 'using the Mobility Print app'
//     : 'using the Print option in the Share Sheet'
// With:
let instructions = 'using the Print option in the Share Sheet'
```

Remove `Platform` from imports on line 3.

- [ ] **Step 7: Simplify `modules/constants/index.ts`**

Replace the platform string logic (lines 54-59):

```typescript
// Replace:
// const platformString =
//   Platform.OS === 'ios'
//     ? 'iOS'
//     : Platform.OS === 'android'
//       ? 'Android'
//       : 'unknown'
// With:
const platformString = 'iOS'
```

Remove `Platform` from imports.

- [ ] **Step 8: Simplify `source/views/building-hours/report/overview.tsx`**

Remove the Android bail-out in the beforeRemove listener (line 55):

```typescript
// Replace:
// if (!hasUnsavedChanges || Platform.OS === 'android') {
// With:
if (!hasUnsavedChanges) {
```

The `Platform.OS === 'ios'` check on line 375 becomes always-true, so simplify:

```typescript
// Replace:
// Platform.OS === 'ios' && <CloseScreenButton title="Discard" />,
// With:
<CloseScreenButton title="Discard" />,
```

Remove `Platform` from imports on line 6.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Remove Platform.OS Android branches from behavioral files"
```

---

### Task 6: Simplify `source/views/sis/balances-acknowledgement.tsx`

This file has Android-specific components (`AndroidP`, `AndroidAck`, `AndroidCard`) that can be removed entirely, keeping only the iOS implementation.

**Files:**
- Modify: `source/views/sis/balances-acknowledgement.tsx`

- [ ] **Step 1: Simplify the file**

Remove Android imports and components:

```typescript
// Remove from imports:
// import {Avatar, Button, Card, Paragraph as AndroidP} from 'react-native-paper'
// Keep:
import {Paragraph} from '@frogpond/markdown'

// Remove Platform import from react-native

// Replace lines 16-17:
// let Paragraph = Platform.OS === 'android' ? AndroidP : IosP
// let Ack = Platform.OS === 'android' ? AndroidAck : IosAck
// With (using direct imports, no runtime switch):
// (Paragraph is now imported directly as Paragraph from @frogpond/markdown)
// (Ack references IosAck directly)
```

Remove the entire `AndroidAck` function (lines 78-94), `TitleLeftIcon` (lines 68-72), and `AvatarIcon` (lines 74-76).

Rename `IosAck` to just `Ack` (or assign directly).

Replace `Platform.select` in styles (lines 126-129):

```typescript
// Replace:
// fontWeight: Platform.select({
//   ios: '600',
//   android: '700',
// }),
// With:
fontWeight: '600',
```

Remove the `androidCard` style.

Remove `Icon` import from `react-native-vector-icons/Ionicons` (only used by Android components).

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Remove Android components from balances-acknowledgement"
```

---

### Task 7: Simplify `source/views/settings/screens/overview/component-library/colors.tsx`

This is a developer component library screen. Remove Android color entries from the examples.

**Files:**
- Modify: `source/views/settings/screens/overview/component-library/colors.tsx`

- [ ] **Step 1: Simplify `createTable` function**

Remove the `if/else if` structure. Since this is iOS-only now, return just the iOS array directly (remove lines 125-180 — the `else if (Platform.OS === 'android')` and `else` branches).

- [ ] **Step 2: Simplify `FallbackColorsExample`**

Remove the `if/else if/else` structure (lines 198-213). Keep only the iOS branch:

```typescript
function FallbackColorsExample() {
	let color = {
		label: "PlatformColor('bogus', 'systemGreenColor')",
		color: PlatformColor('bogus', 'systemGreenColor'),
	}

	return (
		<View style={styles.column}>
			<View style={styles.row}>
				<Text style={styles.labelCell}>{color.label}</Text>
				<View
					style={{
						...styles.colorCell,
						backgroundColor: color.color,
						borderColor: color.color,
					}}
				/>
			</View>
		</View>
	)
}
```

- [ ] **Step 3: Simplify `DynamicColorsExample`**

Remove the ternary — keep only the iOS branch (it already returns JSX for iOS, and a text fallback for non-iOS).

- [ ] **Step 4: Simplify `VariantColorsExample`**

Remove `Platform.select` in the text label — use the iOS label directly. Remove the `Platform.OS` ternary chain in backgroundColor — use just `DynamicColorIOS({light: 'red', dark: 'blue'})`.

- [ ] **Step 5: Simplify `labelCell` style**

Replace `Platform.select` (lines 316-319):

```typescript
labelCell: {
	flex: 1,
	alignItems: 'stretch',
	color: PlatformColor('labelColor'),
},
```

- [ ] **Step 6: Remove unused `Platform` references**

`Platform` is still needed for `PlatformColor`. Remove any unused imports.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Remove Android color examples from component library"
```

---

### Task 8: Update configuration files

**Files:**
- Modify: `.mise.toml`
- Modify: `.github/workflows/build-and-deploy.yml`
- Modify: `.github/workflows/check.yml`

- [ ] **Step 1: Remove Android tasks from `.mise.toml`**

Delete the `[tasks.android]` block:
```toml
[tasks.android]
description = "Run the Android app"
run = "react-native run-android"
```

Delete the `[tasks."bundle:android"]` block:
```toml
[tasks."bundle:android"]
description = "Generate Android JS bundle"
run = """
mkdir -p android/generated/assets/ android/generated/res/
react-native bundle \
  --entry-file index.js \
  --dev true \
  --platform android \
  --bundle-output ./android/generated/assets/index.android.bundle \
  --sourcemap-output ./android/generated/assets/index.android.bundle.map \
  --assets-dest ./android/generated/res/
"""
```

- [ ] **Step 2: Remove Android job from `.github/workflows/build-and-deploy.yml`**

Delete the entire `android:` job block (lines 29-69).

- [ ] **Step 3: Remove Android jobs from `.github/workflows/check.yml`**

Delete the `android-bundle:` job block (lines 151-189).

Delete the `android:` job block (lines 191-241).

Remove `java_version` and `java_distribution` env vars (lines 17-18) since they were only used by the Android job.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Remove Android tasks from mise, CI workflows"
```

---

### Task 9: Update documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `fastlane/README.md`

- [ ] **Step 1: Update `CLAUDE.md`**

Remove references to `.android.tsx` platform-specific files. Change:

```
- Platform-specific files use `.ios.tsx` / `.android.tsx` extensions
```

To:

```
- iOS is the only supported platform
```

Remove the `Platform.select()` reference:

```
- `Platform.select()` for platform-specific styles
```

- [ ] **Step 2: Update `README.md`**

Remove the Google Play badge (line 3):
```markdown
[![Get it on Google Play](images/readme/get_google_play.svg)](https://play.google.com/store/apps/details?id=com.allaboutolaf)
```

Remove the Android beta link (line 12):
```markdown
- [Sign up for the Android Beta](https://play.google.com/apps/testing/com.allaboutolaf)!
```

Remove the Android getting started line (line 23):
```markdown
- For Android: launch your favorite Android emulator first, then run `npm run android`
```

- [ ] **Step 3: Update `fastlane/README.md`**

Remove the entire Android section (lines 18-54, from `## Android` through the last Android lane).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Remove Android references from documentation"
```

---

### Task 10: Verify and push

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors (or same errors as before this change).

- [ ] **Step 2: Run ESLint**

```bash
npm run lint
```

Expected: No new errors.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Fix any issues found and commit**

If type errors or lint errors arose from the changes, fix them and commit.

- [ ] **Step 5: Push to remote**

```bash
git push -u origin claude/remove-android-support-5vuJt
```
