# Expo Router Migration Plan

## Current State

The app is mid-migration from React Navigation to Expo Router. Five top-level routes have been migrated:

| Route | Type | Status |
|---|---|---|
| `/` (Home) | Stack screen | Done |
| `/building-hours` | Stack + dynamic `[location]` | WIP (detail has bugs) |
| `/calendar` | NativeTabs (3 tabs) | Done |
| `/transportation` | NativeTabs (5 tabs) | Done |
| `/more` | Stack screen with search | Done |

The remaining screens are still defined in `src/navigation/routes.tsx` using `createNativeStackNavigator` and reached via imperative `navigation.navigate('ScreenName', {params})` calls. The home screen already links to all routes using `href="/route-name"`, so the href paths are pre-determined.

### Key Migration Patterns (established by existing code)

1. **Route files** go in `src/app/<route>/` and default-export a component
2. **View logic** stays in `src/views/<feature>/` — route files are thin wrappers
3. **Tab layouts** use `NativeTabs` from `expo-router/unstable-native-tabs`
4. **Dynamic routes** use `[param].tsx` with `useLocalSearchParams()`
5. **Header config** uses inline `<Stack.Screen options={{...}} />`
6. **Detail screens** that receive complex objects need to transition from `useRoute()` param passing to `useLocalSearchParams()` with serializable params (or a lookup pattern)

### What needs to change in each detail view

Currently, detail screens receive full objects via route params (e.g., `{contact: ContactType}`). Expo Router serializes params as URL query strings, so **complex objects can't be passed as params**. Each detail screen must be converted to one of:

- **Option A — ID + lookup**: Pass an ID via the URL (`/contacts/[id]`), then look up the full object from a cache/query
- **Option B — Serialized JSON**: Pass a JSON-stringified object via search params (works but ugly URLs)
- **Option A is preferred** and matches the existing `building-hours/location/[location]` pattern

---

## Migration Order

Screens are grouped by complexity. Migrate simpler screens first to build momentum.

### Phase 1: Simple Screens (no detail views, no tabs)

#### 1.1 — FAQs (`/settings/faq`)

FAQs is a single screen shown from Settings. Create it as a nested route under settings.

```
src/app/settings/faq.tsx
```

```tsx
// src/app/settings/faq.tsx
import React from 'react'
import {FaqView} from '../../views/faqs'
import {Stack} from 'expo-router'

export default function FaqScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'FAQs'}} />
			<FaqView />
		</>
	)
}
```

> The `FaqView` component is self-contained — just needs a `View` export rename or use `FaqView as View` import.

---

### Phase 2: List-Only Screens (no sub-navigation)

#### 2.1 — Contacts (`/contacts` + `/contacts/[id]`)

**Files to create:**
```
src/app/contacts/index.tsx          # list
src/app/contacts/[contact].tsx      # detail (by contact title or index)
```

**List route — thin wrapper:**
```tsx
// src/app/contacts/index.tsx
import React from 'react'
import {ContactsListView} from '../../views/contacts/list'
import {Stack} from 'expo-router'

export default function ContactsScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Important Contacts'}} />
			<ContactsListView />
		</>
	)
}
```

**Detail route — convert from `useRoute` to `useLocalSearchParams`:**
```tsx
// src/app/contacts/[contact].tsx
import React from 'react'
import {ContactsDetailView} from '../../views/contacts/detail'
import {Stack} from 'expo-router'

export default function ContactsDetailScreen(): React.ReactNode {
	return <ContactsDetailView />
}
```

**Required view changes** (`src/views/contacts/detail.tsx`):
- Replace `useRoute<RouteProp<RootStackParamList, ...>>()` with `useLocalSearchParams()`
- Since contacts are fetched via a query, pass a contact identifier in the URL and look it up from the query cache
- Alternatively, serialize the contact object as a JSON search param (quick but less clean)

**Required view changes** (`src/views/contacts/list.tsx`):
- Replace `navigation.navigate(DetailNavigationKey, {contact: contactData})` with `router.push({pathname: '/contacts/[contact]', params: {contact: contactData.title}})`
- Or use `<Link href={...}>` pattern

#### 2.2 — Dictionary (`/dictionary` + `/dictionary/[word]` + `/dictionary/report`)

**Files to create:**
```
src/app/dictionary/index.tsx           # list
src/app/dictionary/[word].tsx          # detail
src/app/dictionary/report.tsx          # editor/report
```

**Same pattern as contacts.** The dictionary detail receives `{item: WordType}`. Convert to pass an identifier and look up from the query cache.

#### 2.3 — Student Orgs (`/student-orgs` + `/student-orgs/[org]`)

**Files to create:**
```
src/app/student-orgs/index.tsx         # list
src/app/student-orgs/[org].tsx         # detail (platform-specific: .android.tsx/.ios.tsx)
```

**Note:** Student orgs detail has platform-specific files (`detail-android.tsx`, `detail-ios.tsx`, `detail.ts` as router). The `detail.ts` re-exports based on platform, so the existing pattern should work. The detail view receives `{org: StudentOrgType}` — convert to ID lookup.

#### 2.4 — Directory (`/directory` + `/directory/[contact]`)

**Files to create:**
```
src/app/directory/index.tsx            # search/list
src/app/directory/[contact].tsx        # detail (platform-specific)
```

**Note:** Directory list also accepts optional initial params `{queryType, queryParam}`. These can be passed as search params in the URL. Detail has platform-specific files.

---

### Phase 3: Tabbed Screens

These screens currently use `createTabNavigator()` from `modules/navigation-tabs/tabbed-view.tsx` (wrapping `@react-navigation/bottom-tabs`). Each must be converted to use `NativeTabs` from Expo Router, matching the pattern in `calendar/_layout.tsx` and `transportation/_layout.tsx`.

#### 3.1 — Menus (`/menus`)

**Files to create:**
```
src/app/menus/_layout.tsx              # NativeTabs layout
src/app/menus/index.tsx                # Stav Hall (default tab)
src/app/menus/the-cage.tsx             # The Cage
src/app/menus/the-pause.tsx            # The Pause
src/app/menus/carleton.tsx             # Carleton menu list
src/app/menus/carleton-burton.tsx      # Carleton Burton detail
src/app/menus/carleton-ldc.tsx         # Carleton LDC detail
src/app/menus/carleton-sayles.tsx      # Carleton Sayles detail
src/app/menus/carleton-weitz.tsx       # Carleton Weitz detail
src/app/menus/item-detail.tsx          # Menu item nutrition detail
```

**Tab layout:**
```tsx
// src/app/menus/_layout.tsx
import React from 'react'
import {NativeTabs, Icon, Label} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function MenusTabLayout() {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'Menus'}} />

			<NativeTabs.Trigger name="index">
				<Label>Stav Hall</Label>
				{Platform.select({
					ios: <Icon sf="fork.knife" />,
					android: <Icon src={<MaterialDesignIcons name="food-apple" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="the-cage">
				<Label>The Cage</Label>
				{Platform.select({
					ios: <Icon sf="cup.and.saucer.fill" />,
					android: <Icon src={<MaterialDesignIcons name="coffee" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="the-pause">
				<Label>The Pause</Label>
				{Platform.select({
					ios: <Icon sf="pawprint.fill" />,
					android: <Icon src={<MaterialDesignIcons name="paw" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="carleton">
				<Label>Carleton</Label>
				{Platform.select({
					ios: <Icon sf="list.bullet" />,
					android: <Icon src={<MaterialDesignIcons name="menu" />} />,
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

**Tab content (example):**
```tsx
// src/app/menus/index.tsx
import React from 'react'
import {BonAppMenu} from '../../views/menus/menu-bonapp'

export default function StavHallMenuTab(): React.ReactNode {
	return <BonAppMenu cafe="stav-hall" />
}
```

**Carleton sub-menus and item detail** are pushed as stack screens from within the tab. These need their own route files so Expo Router can resolve them. The Carleton menu list navigates to specific cafe pages, and each cafe's menu can navigate to an item detail page.

**Required view changes:**
- `src/views/menus/carleton-menus.tsx`: Change `navigation.navigate('CarletonBurtonMenu')` to `router.push('/menus/carleton-burton')`
- `@frogpond/food-menu/food-item-detail.tsx`: Convert from `useRoute()` to `useLocalSearchParams()` for item detail. This module also references the old `source/navigation/types` path — update the import.

#### 3.2 — News (`/news`)

**Files to create:**
```
src/app/news/_layout.tsx               # NativeTabs layout
src/app/news/index.tsx                 # St. Olaf news (default tab)
src/app/news/mess.tsx                  # Mess news
src/app/news/oleville.tsx              # Oleville news
```

**Tab layout:**
```tsx
// src/app/news/_layout.tsx
import React from 'react'
import {NativeTabs, Icon, Label} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function NewsTabLayout() {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'News'}} />

			<NativeTabs.Trigger name="index">
				<Label>St. Olaf</Label>
				{Platform.select({
					ios: <Icon sf="graduationcap.fill" />,
					android: <Icon src={<MaterialDesignIcons name="school" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="mess">
				<Label>Mess</Label>
				{Platform.select({
					ios: <Icon sf="newspaper.fill" />,
					android: <Icon src={<MaterialDesignIcons name="newspaper-variant" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="oleville">
				<Label>Oleville</Label>
				{Platform.select({
					ios: <Icon sf="face.smiling.fill" />,
					android: <Icon src={<MaterialDesignIcons name="emoticon-happy" />} />,
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

**Tab content (example):**
```tsx
// src/app/news/index.tsx
import React from 'react'
import {CccCalendarView, useNamedCalendar} from '@frogpond/ccc-calendar'

export default function StOlafNewsTab(): React.ReactNode {
	return <CccCalendarView query={useNamedCalendar('stolaf-news')} />
}
```

**Note:** News tabs may navigate to an event detail screen. The `EventDetail` from `@frogpond/event-list` needs a route file too — see Phase 5.

#### 3.3 — SIS (`/sis`)

**Files to create:**
```
src/app/sis/_layout.tsx                # NativeTabs layout
src/app/sis/index.tsx                  # Balances (default tab)
src/app/sis/student-work.tsx           # Student Work tab
src/app/sis/course-search/index.tsx    # Course search form
src/app/sis/course-search/results.tsx  # Search results
src/app/sis/course-search/[course].tsx # Course detail
src/app/sis/job/[job].tsx              # Job detail
```

**Tab layout:**
```tsx
// src/app/sis/_layout.tsx
import React from 'react'
import {NativeTabs, Icon, Label} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function SisTabLayout() {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'SIS'}} />

			<NativeTabs.Trigger name="index">
				<Label>Balances</Label>
				{Platform.select({
					ios: <Icon sf="creditcard.fill" />,
					android: <Icon src={<MaterialDesignIcons name="credit-card" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="student-work">
				<Label>Student Work</Label>
				{Platform.select({
					ios: <Icon sf="briefcase.fill" />,
					android: <Icon src={<MaterialDesignIcons name="briefcase-search" />} />,
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

**Course search** is accessed from the Home screen via `href="/sis/course-search"`. It's a multi-step flow (search form → results → detail) that lives under the SIS route but isn't a tab. This requires a nested stack or group within the SIS route segment.

**Required view changes:**
- `src/views/sis/course-search/search.tsx`: Change `navigation.navigate('CourseSearchResults', {...})` to `router.push(...)`
- `src/views/sis/course-search/results.tsx`: Convert `useRoute()` params to `useLocalSearchParams()` for initial filters
- `src/views/sis/course-search/detail/index.tsx`: Convert `useRoute()` to `useLocalSearchParams()` — pass course identifier
- `src/views/sis/student-work/index.tsx`: Change navigation to job detail
- `src/views/sis/student-work/detail-*.tsx`: Convert `useRoute()` to `useLocalSearchParams()`

#### 3.4 — Streaming Media (`/streaming`)

**Files to create:**
```
src/app/streaming/_layout.tsx          # NativeTabs layout
src/app/streaming/index.tsx            # Streams list (default tab)
src/app/streaming/webcams.tsx          # Webcams tab
src/app/streaming/ksto.tsx             # KSTO radio tab
src/app/streaming/krlx.tsx             # KRLX radio tab
src/app/streaming/ksto-schedule.tsx    # KSTO schedule (pushed from KSTO tab)
src/app/streaming/krlx-schedule.tsx    # KRLX schedule (pushed from KRLX tab)
```

**Tab layout:**
```tsx
// src/app/streaming/_layout.tsx
import React from 'react'
import {NativeTabs, Icon, Label} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function StreamingTabLayout() {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'Streaming Media'}} />

			<NativeTabs.Trigger name="index">
				<Label>Streaming</Label>
				{Platform.select({
					ios: <Icon sf="record.circle" />,
					android: <Icon src={<MaterialDesignIcons name="camcorder" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="webcams">
				<Label>Webcams</Label>
				{Platform.select({
					ios: <Icon sf="video.fill" />,
					android: <Icon src={<MaterialDesignIcons name="webcam" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="ksto">
				<Label>KSTO</Label>
				{Platform.select({
					ios: <Icon sf="radio.fill" />,
					android: <Icon src={<MaterialDesignIcons name="radio" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="krlx">
				<Label>KRLX</Label>
				{Platform.select({
					ios: <Icon sf="mic.fill" />,
					android: <Icon src={<MaterialDesignIcons name="microphone" />} />,
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

**Schedule screens** are pushed from the radio controller views. These need route files so `router.push('/streaming/ksto-schedule')` can resolve.

**Required view changes:**
- `src/views/streaming/radio/controller.tsx`: Change `navigation.navigate('KSTOSchedule')` / `navigation.navigate('KRLXSchedule')` to `router.push('/streaming/ksto-schedule')` / `router.push('/streaming/krlx-schedule')`

---

### Phase 4: StoPrint (`/stoprint`)

StoPrint has three screens in a linear flow: Print Jobs → Printer List → Print Job Release.

**Files to create:**
```
src/app/stoprint/index.tsx             # Print Jobs list
src/app/stoprint/printers.tsx          # Printer list (receives job)
src/app/stoprint/release.tsx           # Print job release (receives job + printer)
```

**Route files — thin wrappers:**
```tsx
// src/app/stoprint/index.tsx
import React from 'react'
import {PrintJobsView} from '../../views/stoprint/print-jobs'
import {Stack} from 'expo-router'

export default function StoPrintScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Print Jobs'}} />
			<PrintJobsView />
		</>
	)
}
```

**Required view changes:**
- `src/views/stoprint/print-jobs.tsx`: Change `navigation.navigate('PrinterList', {job})` and `navigation.navigate('PrintJobRelease', {job})` to `router.push(...)` with serializable params
- `src/views/stoprint/printers.tsx`: Convert `useRoute()` to `useLocalSearchParams()`
- `src/views/stoprint/print-release.tsx`: Convert `useRoute()` to `useLocalSearchParams()`

**Param strategy:** Print job and printer objects could be passed as JSON search params since they're small, or stored in a transient cache/context.

---

### Phase 5: Settings (`/settings`)

Settings is presented as a modal stack. In Expo Router, this can be a route group with `presentation: 'modal'`.

**Files to create:**
```
src/app/settings/_layout.tsx           # Stack layout with modal presentation
src/app/settings/index.tsx             # Settings overview
src/app/settings/faq.tsx               # FAQs
src/app/settings/credits.tsx           # Credits
src/app/settings/privacy.tsx           # Privacy
src/app/settings/legal.tsx             # Legal
src/app/settings/api-test/index.tsx    # API test list (dev)
src/app/settings/api-test/[query].tsx  # API test detail (dev)
src/app/settings/bonapp-picker.tsx     # BonApp picker (dev)
src/app/settings/debug.tsx             # Debug view (dev)
src/app/settings/network-logger.tsx    # Network logger (dev)
src/app/settings/component-library/index.tsx    # Component library root
src/app/settings/component-library/badges.tsx
src/app/settings/component-library/buttons.tsx
src/app/settings/component-library/colors.tsx
src/app/settings/component-library/context-menus.tsx
```

**Layout with modal presentation:**
```tsx
// src/app/settings/_layout.tsx
import React from 'react'
import {Stack} from 'expo-router'

export default function SettingsLayout() {
	return <Stack screenOptions={{presentation: 'modal'}} />
}
```

> Note: The root `_layout.tsx` may need a `<Stack.Screen name="settings" options={{presentation: 'modal', headerShown: false}} />` entry to present the settings group as a modal.

**Required view changes:**
- `src/views/settings/screens/overview/support.tsx`: Change `navigation.navigate('Faq')` to `router.push('/settings/faq')`
- `src/views/settings/screens/overview/miscellany.tsx`: Update navigation calls
- `src/views/settings/screens/overview/developer.tsx`: Update navigation calls
- `src/views/settings/screens/api-test/list.tsx`: Change navigation to detail
- `src/views/settings/screens/debug/list.tsx`: Convert `useRoute()` to `useLocalSearchParams()`
- `src/views/settings/screens/overview/component-library/library.tsx`: Update navigation calls
- `modules/navigation-buttons/open-settings.tsx`: Already uses `<Link href="/settings" />` — no changes needed

---

### Phase 6: Shared Detail Screens

These detail screens are pushed from multiple feature areas:

#### 6.1 — Event Detail

Used by Calendar, News, and any CCC calendar view. Currently lives in `modules/event-list/`.

**File to create:**
```
src/app/event/[event].tsx              # Event detail
```

**Required module changes:**
- `modules/event-list/event-detail-ios.tsx`: Convert from `useRoute()` to `useLocalSearchParams()`. Update `source/navigation/types` import.
- `modules/event-list/event-detail-android.tsx`: Same changes.

#### 6.2 — Bus Route Detail

Used by Transportation tab views.

**File to create:**
```
src/app/transportation/route-detail.tsx   # Bus route detail
```

**Required view changes:**
- `src/views/transportation/bus/detail.tsx`: Convert from `useRoute()` to `useLocalSearchParams()`
- `src/views/transportation/bus/line.tsx`: Change navigation to use `router.push()`

---

### Phase 7: Finish Building Hours WIP

The building hours detail view (`src/app/building-hours/location/[location].tsx`) has a bug — it references `route.params` which doesn't exist in Expo Router. It needs to fully use `useLocalSearchParams()` and look up the building from the query cache.

**Required changes:**
- Fix `[location].tsx` to look up building data by name from the `useGroupedBuildings()` query cache
- Wire up the edit/report sub-routes properly
- Verify the favorite toggle works with the location name from params

---

### Phase 8: Cleanup

Once all screens are migrated:

1. **Delete `src/navigation/routes.tsx`** — no longer needed
2. **Delete `src/navigation/types.tsx`** — replace with Expo Router typed routes
3. **Delete or simplify `modules/navigation-tabs/tabbed-view.tsx`** — the `createTabNavigator()` helper is replaced by `NativeTabs`
4. **Remove old `@react-navigation/native` imports** from all view files that have been converted
5. **Remove the `ReactNavigation` global type augmentation** from `types.tsx`
6. **Update `package.json`**:
   - Change lint script from `source/` to `src/`
   - Change start script from `react-native start` to `expo start`
7. **Remove unused dependencies** if `@react-navigation/bottom-tabs` and `@react-navigation/native-stack` are no longer imported anywhere
8. **Update `modules/event-list/` and `modules/food-menu/`** to remove `source/navigation/types` imports

---

## Param Passing Strategy

This is the most consequential architectural decision. Expo Router passes params as URL search params (strings). The old React Navigation approach of passing full objects like `{contact: ContactType}` won't work.

### Recommended approach per screen type:

| Screen | Current Params | New Strategy |
|---|---|---|
| Contacts detail | `{contact: ContactType}` | Pass contact title as `[contact]` segment; look up from query cache |
| Dictionary detail | `{item: WordType}` | Pass word term as `[word]` segment; look up from query cache |
| Student orgs detail | `{org: StudentOrgType}` | Pass org name as `[org]` segment; look up from query cache |
| Directory detail | `{contact: DirectoryItem}` | Pass as JSON search param (directory results aren't cached) |
| Building hours detail | `{building: BuildingType}` | Pass building name as `[location]` segment; look up from query cache (already started) |
| Event detail | `{event: EventType}` | Pass event ID or title; look up from query cache |
| Bus route detail | `{stop, line, subtitle}` | Pass line name + stop index; look up from processed bus data |
| Menu item detail | `{item: MenuItem, icons}` | Pass as JSON search params (small payload) |
| Course detail | `{course: CourseType}` | Pass course ID; look up from search results cache |
| Job detail | `{job: JobType}` | Pass job ID; look up from query cache |
| Print job release | `{job: PrintJob, printer?: Printer}` | Pass job ID + optional printer ID; look up from cache |
| Course search results | `{initialQuery, initialFilters}` | Pass query string + filter JSON as search params |
| Debug view | `{keyPath: string[]}` | Pass keyPath as JSON search param |
| API test detail | `{query: ServerRoute}` | Pass route index or serialize as search param |

### Implementation helper

Create a small utility to look up items from React Query cache:

```tsx
// src/lib/use-cached-item.ts
import {useQueryClient} from '@tanstack/react-query'

export function useCachedItem<T>(
	queryKey: unknown[],
	predicate: (item: T) => boolean,
): T | undefined {
	let queryClient = useQueryClient()
	let data = queryClient.getQueryData<T[]>(queryKey)
	return data?.find(predicate)
}
```

---

## File Summary

### New files to create (~40 files):

```
src/app/contacts/index.tsx
src/app/contacts/[contact].tsx
src/app/dictionary/index.tsx
src/app/dictionary/[word].tsx
src/app/dictionary/report.tsx
src/app/student-orgs/index.tsx
src/app/student-orgs/[org].tsx
src/app/directory/index.tsx
src/app/directory/[contact].tsx
src/app/menus/_layout.tsx
src/app/menus/index.tsx
src/app/menus/the-cage.tsx
src/app/menus/the-pause.tsx
src/app/menus/carleton.tsx
src/app/menus/carleton-burton.tsx
src/app/menus/carleton-ldc.tsx
src/app/menus/carleton-sayles.tsx
src/app/menus/carleton-weitz.tsx
src/app/menus/item-detail.tsx
src/app/news/_layout.tsx
src/app/news/index.tsx
src/app/news/mess.tsx
src/app/news/oleville.tsx
src/app/sis/_layout.tsx
src/app/sis/index.tsx
src/app/sis/student-work.tsx
src/app/sis/course-search/index.tsx
src/app/sis/course-search/results.tsx
src/app/sis/course-search/[course].tsx
src/app/sis/job/[job].tsx
src/app/streaming/_layout.tsx
src/app/streaming/index.tsx
src/app/streaming/webcams.tsx
src/app/streaming/ksto.tsx
src/app/streaming/krlx.tsx
src/app/streaming/ksto-schedule.tsx
src/app/streaming/krlx-schedule.tsx
src/app/stoprint/index.tsx
src/app/stoprint/printers.tsx
src/app/stoprint/release.tsx
src/app/settings/_layout.tsx
src/app/settings/index.tsx
src/app/settings/faq.tsx
src/app/settings/credits.tsx
src/app/settings/privacy.tsx
src/app/settings/legal.tsx
src/app/settings/api-test/index.tsx
src/app/settings/api-test/[query].tsx
src/app/settings/bonapp-picker.tsx
src/app/settings/debug.tsx
src/app/settings/network-logger.tsx
src/app/settings/component-library/index.tsx
src/app/settings/component-library/badges.tsx
src/app/settings/component-library/buttons.tsx
src/app/settings/component-library/colors.tsx
src/app/settings/component-library/context-menus.tsx
src/app/event/[event].tsx
src/app/transportation/route-detail.tsx
src/lib/use-cached-item.ts
```

### Existing files to modify (~30 files):

All detail views need `useRoute()` → `useLocalSearchParams()` conversion:
- `src/views/contacts/detail.tsx`
- `src/views/contacts/list.tsx`
- `src/views/dictionary/detail.tsx`
- `src/views/dictionary/list.tsx`
- `src/views/dictionary/report/editor.tsx`
- `src/views/student-orgs/list.tsx`
- `src/views/student-orgs/detail-android.tsx`
- `src/views/student-orgs/detail-ios.tsx`
- `src/views/directory/list.tsx`
- `src/views/directory/detail.android.tsx`
- `src/views/directory/detail.ios.tsx`
- `src/views/menus/carleton-menus.tsx`
- `src/views/streaming/radio/controller.tsx`
- `src/views/stoprint/print-jobs.tsx`
- `src/views/stoprint/printers.tsx`
- `src/views/stoprint/print-release.tsx`
- `src/views/sis/course-search/search.tsx`
- `src/views/sis/course-search/results.tsx`
- `src/views/sis/course-search/detail/index.tsx`
- `src/views/sis/student-work/index.tsx`
- `src/views/sis/student-work/detail-android.tsx`
- `src/views/sis/student-work/detail-ios.tsx`
- `src/views/settings/screens/overview/support.tsx`
- `src/views/settings/screens/overview/miscellany.tsx`
- `src/views/settings/screens/overview/developer.tsx`
- `src/views/settings/screens/api-test/list.tsx`
- `src/views/settings/screens/api-test/detail.tsx`
- `src/views/settings/screens/debug/list.tsx`
- `src/views/settings/screens/overview/component-library/library.tsx`
- `src/views/transportation/bus/detail.tsx`
- `src/views/transportation/bus/line.tsx`
- `src/views/transportation/bus/map.tsx`
- `src/views/building-hours/report/overview.tsx`
- `src/views/building-hours/report/editor.tsx`
- `src/app/building-hours/location/[location].tsx` (fix existing WIP)
- `modules/event-list/event-detail-ios.tsx`
- `modules/event-list/event-detail-android.tsx`
- `modules/food-menu/food-item-detail.tsx`

### Files to delete (Phase 8):
- `src/navigation/routes.tsx`
- `src/navigation/types.tsx`

---

## Detailed Task Checklist

### Phase 0: Foundation

- [x] ~~Create `src/lib/use-cached-item.ts`~~ — Skipped: used JSON serialization pattern instead of query-cache lookup
- [x] Verify `useLocalSearchParams` typing approach works with a quick prototype (e.g., building hours detail fix)

### Phase 1: Simple Screens

- [x] **1.1 FAQs**
  - [x] Create `src/app/settings/faq.tsx` — route wrapper for `FaqView`
  - [x] Update `src/views/faqs/index.tsx` — export named `FaqView` if not already (currently exports `View`)

### Phase 2: List + Detail Screens

- [x] **2.1 Contacts**
  - [x] Create `src/app/contacts/index.tsx` — list route wrapper
  - [x] Create `src/app/contacts/[contact].tsx` — detail route wrapper
  - [x] Update `src/views/contacts/list.tsx` — replace `navigation.navigate(DetailNavigationKey, {contact})` with `router.push()` to `/contacts/[contact]`
  - [x] Update `src/views/contacts/detail.tsx` — replace `useRoute()` + `RouteProp` with `useLocalSearchParams()`; look up contact from query cache by identifier
  - [x] Remove `@react-navigation/native` and `RootStackParamList` imports from both files

- [x] **2.2 Dictionary**
  - [x] Create `src/app/dictionary/index.tsx` — list route wrapper
  - [x] Create `src/app/dictionary/[word].tsx` — detail route wrapper
  - [x] Create `src/app/dictionary/report.tsx` — editor route wrapper
  - [x] Update `src/views/dictionary/list.tsx` — replace `navigation.navigate('DictionaryDetail', {item})` with `router.push()` to `/dictionary/[word]`
  - [x] Update `src/views/dictionary/detail.tsx` — replace `useRoute()` with `useLocalSearchParams()`; look up word from query cache
  - [x] Update `src/views/dictionary/detail.tsx` — replace `navigation.navigate('DictionaryEditor', {item})` with `router.push('/dictionary/report')`
  - [x] Update `src/views/dictionary/report/editor.tsx` — replace `useRoute()` with `useLocalSearchParams()`
  - [x] Remove old navigation imports from all modified files

- [x] **2.3 Student Orgs**
  - [x] Create `src/app/student-orgs/index.tsx` — list route wrapper
  - [x] Create `src/app/student-orgs/[org].tsx` — detail route wrapper
  - [x] Update `src/views/student-orgs/list.tsx` — replace `navigation.navigate('StudentOrgsDetail', {org})` with `router.push()` to `/student-orgs/[org]`
  - [x] Update `src/views/student-orgs/detail-ios.tsx` — replace `useRoute()` with `useLocalSearchParams()`; look up org from query cache
  - [x] Update `src/views/student-orgs/detail-android.tsx` — same conversion as iOS
  - [x] Remove old navigation imports from all modified files

- [x] **2.4 Directory**
  - [x] Create `src/app/directory/index.tsx` — search/list route wrapper (pass `queryType`/`queryParam` as search params)
  - [x] Create `src/app/directory/[contact].tsx` — detail route wrapper
  - [x] Update `src/views/directory/list.tsx` — replace `navigation.push('DirectoryDetail', {contact: item})` with `router.push()` to `/directory/[contact]`; replace `useRoute()` for initial params with `useLocalSearchParams()`
  - [x] Update `src/views/directory/detail.ios.tsx` — replace `useRoute()` with `useLocalSearchParams()`; deserialize contact from JSON search param
  - [x] Update `src/views/directory/detail.android.tsx` — same conversion as iOS
  - [x] Remove old `RootStackParamList`, `NativeStackNavigationProp`, `RouteProp`, `useRoute`, `useNavigation` imports from all modified files

### Phase 3: Tabbed Screens

- [x] **3.1 Menus**
  - [x] Create `src/app/menus/_layout.tsx` — NativeTabs layout with 4 triggers (Stav Hall, The Cage, The Pause, Carleton)
  - [x] Create `src/app/menus/index.tsx` — Stav Hall tab (wraps `StavHallMenuView`)
  - [x] Create `src/app/menus/the-cage.tsx` — The Cage tab (wraps `TheCageMenuView`)
  - [x] Create `src/app/menus/the-pause.tsx` — The Pause tab (wraps `ThePauseMenuView`)
  - [x] Create `src/app/menus/carleton.tsx` — Carleton tab (wraps `CarletonMenuListView`)
  - [x] Create `src/app/menus/carleton-burton.tsx` — route for Carleton Burton menu
  - [x] Create `src/app/menus/carleton-ldc.tsx` — route for Carleton LDC menu
  - [x] Create `src/app/menus/carleton-sayles.tsx` — route for Carleton Sayles menu
  - [x] Create `src/app/menus/carleton-weitz.tsx` — route for Carleton Weitz menu
  - [x] Create `src/app/menus/item-detail.tsx` — route for menu item nutrition detail
  - [x] Update `src/views/menus/carleton-menus.tsx` — replace `navigation.navigate('CarletonBurtonMenu')` etc. with `router.push('/menus/carleton-burton')` etc.
  - [x] Update `modules/food-menu/food-item-detail.tsx` — replace `useRoute()` with `useLocalSearchParams()`; fix `source/navigation/types` import
  - [x] Update `src/views/menus/index.tsx` — remove `createTabNavigator()` usage (tabs now handled by `_layout.tsx`)

- [x] **3.2 News**
  - [x] Create `src/app/news/_layout.tsx` — NativeTabs layout with 3 triggers (St. Olaf, Mess, Oleville)
  - [x] Create `src/app/news/index.tsx` — St. Olaf news tab
  - [x] Create `src/app/news/mess.tsx` — Mess news tab
  - [x] Create `src/app/news/oleville.tsx` — Oleville news tab
  - [x] Update `src/views/news/index.tsx` — remove `createTabNavigator()` usage

- [x] **3.3 SIS**
  - [x] Create `src/app/sis/_layout.tsx` — NativeTabs layout with 2 triggers (Balances, Student Work)
  - [x] Create `src/app/sis/index.tsx` — Balances tab
  - [x] Create `src/app/sis/student-work.tsx` — Student Work tab
  - [x] Create `src/app/sis/job/[job].tsx` — Job detail route
  - [x] Create `src/app/sis/course-search/index.tsx` — Course search form route
  - [x] Create `src/app/sis/course-search/results.tsx` — Course search results route
  - [x] Create `src/app/sis/course-search/[course].tsx` — Course detail route
  - [x] Update `src/views/sis/course-search/search.tsx` — replace `navigation.navigate('CourseSearchResults', {...})` with `router.push('/sis/course-search/results', ...)`
  - [x] Update `src/views/sis/course-search/results.tsx` — replace `useRoute()` with `useLocalSearchParams()` for initial query/filters
  - [x] Update `src/views/sis/course-search/results.tsx` — replace `navigation.navigate('CourseDetail', {course})` with `router.push('/sis/course-search/[course]')`
  - [x] Update `src/views/sis/course-search/detail/index.tsx` — replace `useRoute()` with `useLocalSearchParams()`; look up course from query cache
  - [x] Update `src/views/sis/student-work/index.tsx` — replace `navigation.navigate('JobDetail', {job})` with `router.push('/sis/job/[job]')`
  - [x] Update `src/views/sis/student-work/detail-ios.tsx` — replace `useRoute()` with `useLocalSearchParams()`; look up job from query cache
  - [x] Update `src/views/sis/student-work/detail-android.tsx` — same conversion as iOS
  - [x] Update `src/views/sis/balances.tsx` — verify `useNavigation` import is from `expo-router` (already is)
  - [x] Update `src/views/sis/index.tsx` — remove `createTabNavigator()` usage

- [x] **3.4 Streaming Media**
  - [x] Create `src/app/streaming/_layout.tsx` — NativeTabs layout with 4 triggers (Streaming, Webcams, KSTO, KRLX)
  - [x] Create `src/app/streaming/index.tsx` — Streaming tab
  - [x] Create `src/app/streaming/webcams.tsx` — Webcams tab
  - [x] Create `src/app/streaming/ksto.tsx` — KSTO radio tab
  - [x] Create `src/app/streaming/krlx.tsx` — KRLX radio tab
  - [x] Create `src/app/streaming/ksto-schedule.tsx` — KSTO schedule route
  - [x] Create `src/app/streaming/krlx-schedule.tsx` — KRLX schedule route
  - [x] Update `src/views/streaming/radio/controller.tsx` — replace `navigation.navigate('KSTOSchedule')` with `router.push('/streaming/ksto-schedule')`; same for KRLX
  - [x] Update `src/views/streaming/index.tsx` — remove `createTabNavigator()` usage

### Phase 4: StoPrint

- [x] Create `src/app/stoprint/index.tsx` — Print Jobs list route
- [x] Create `src/app/stoprint/printers.tsx` — Printer list route
- [x] Create `src/app/stoprint/release.tsx` — Print job release route
- [x] Update `src/views/stoprint/print-jobs.tsx` — replace `navigation.navigate('PrinterList', {job})` and `navigation.navigate('PrintJobRelease', {job})` with `router.push()` using serializable params
- [x] Update `src/views/stoprint/printers.tsx` — replace `useRoute()` with `useLocalSearchParams()`; look up job from cache or deserialize
- [x] Update `src/views/stoprint/printers.tsx` — replace `navigation.navigate('PrintJobRelease', {job, printer})` with `router.push()`
- [x] Update `src/views/stoprint/print-release.tsx` — replace `useRoute()` with `useLocalSearchParams()`; look up job+printer from cache or deserialize
- [x] Remove old navigation imports from all modified stoprint files

### Phase 5: Settings

- [x] **5.1 Settings layout and main screens**
  - [x] Create `src/app/settings/_layout.tsx` — Stack layout with modal presentation
  - [x] Update `src/app/_layout.tsx` — add `<Stack.Screen name="settings" options={{presentation: 'modal', headerShown: false}} />` to present settings as modal
  - [x] Create `src/app/settings/index.tsx` — Settings overview route (wraps `SettingsView`)
  - [x] Create `src/app/settings/credits.tsx` — Credits route
  - [x] Create `src/app/settings/privacy.tsx` — Privacy route
  - [x] Create `src/app/settings/legal.tsx` — Legal route
  - [x] Update `src/views/settings/screens/overview/support.tsx` — replace `navigation.navigate('Faq')` with `router.push('/settings/faq')`
  - [x] Update `src/views/settings/screens/overview/miscellany.tsx` — replace all `navigation.navigate()` calls with `router.push()` equivalents

- [x] **5.2 Developer screens**
  - [x] Create `src/app/settings/api-test/index.tsx` — API test list route
  - [x] Create `src/app/settings/api-test/[query].tsx` — API test detail route
  - [x] Create `src/app/settings/bonapp-picker.tsx` — BonApp picker route
  - [x] Create `src/app/settings/debug.tsx` — Debug view route
  - [x] Create `src/app/settings/network-logger.tsx` — Network logger route
  - [x] Update `src/views/settings/screens/overview/developer.tsx` — replace `navigation.navigate('ComponentLibrary')` with `router.push('/settings/component-library')`
  - [x] Update `src/views/settings/screens/api-test/list.tsx` — replace `navigation.navigate('APITestDetail', {query})` with `router.push()`
  - [x] Update `src/views/settings/screens/api-test/detail.tsx` — replace `useRoute()` with `useLocalSearchParams()`
  - [x] Update `src/views/settings/screens/debug/list.tsx` — replace `useRoute()` with `useLocalSearchParams()` for `keyPath`; replace `navigation.navigate()` with `router.push()`
  - [x] Update `modules/navigation-buttons/network-logger.tsx` — replace `navigation.navigate('NetworkLogger')` with `router.push('/settings/network-logger')`

- [x] **5.3 Component library**
  - [x] Create `src/app/settings/component-library/index.tsx` — Component library root route
  - [x] Create `src/app/settings/component-library/badges.tsx` — Badge library route
  - [x] Create `src/app/settings/component-library/buttons.tsx` — Button library route
  - [x] Create `src/app/settings/component-library/colors.tsx` — Colors library route
  - [x] Create `src/app/settings/component-library/context-menus.tsx` — Context menu library route
  - [x] Update `src/views/settings/screens/overview/component-library/library.tsx` — replace `navigation.navigate('BadgeLibrary')` etc. with `router.push('/settings/component-library/badges')` etc.

### Phase 6: Shared Detail Screens

- [x] **6.1 Event Detail**
  - [x] Create `src/app/event/[event].tsx` — Event detail route wrapper
  - [x] Update `modules/event-list/event-detail-ios.tsx` — replace `useRoute()` with `useLocalSearchParams()`; fix `source/navigation/types` import path
  - [x] Update `modules/event-list/event-detail-android.tsx` — same conversion as iOS
  - [x] Update all callers that navigate to `EventDetail` — replace `navigation.navigate(NavigationKey, {event})` with `router.push('/event/[event]')` pattern
  - [x] Determine param strategy: used JSON serialization via search params

- [x] **6.2 Bus Route Detail**
  - [x] Create `src/app/transportation/route-detail.tsx` — Bus route detail route wrapper
  - [x] Update `src/views/transportation/bus/detail.tsx` — replace `useRoute()` with `useLocalSearchParams()`; look up stop/line from bus data
  - [x] Update `src/views/transportation/bus/line.tsx` — replace `navigation.navigate('BusRouteDetail', {stop, line, subtitle})` with `router.push('/transportation/route-detail')` with serializable params
  - [x] Update `src/views/transportation/bus/map.tsx` — replace `useRoute()` with `useLocalSearchParams()` if this screen needs a route file too

### Phase 7: Fix Building Hours WIP

- [x] Fix `src/app/building-hours/location/[location].tsx` — remove stale `route.params` reference; use only `useLocalSearchParams()` to get location name
- [x] Add building data lookup — use `useGroupedBuildings()` or similar query to find the building by name from the location param
- [x] Create `src/app/building-hours/report/index.tsx` — report overview route wrapper (if not already created)
- [x] Create `src/app/building-hours/report/editor.tsx` — schedule editor route wrapper (if not already created)
- [x] Update `src/views/building-hours/report/overview.tsx` — replace `useRoute()` with `useLocalSearchParams()`; replace `navigation.navigate()` with `router.push()`
- [x] Update `src/views/building-hours/report/editor.tsx` — replace `useRoute()` with `useLocalSearchParams()`
- [x] Update `src/app/building-hours/index.tsx` — replace `navigation.navigate('BuildingHoursDetail', {building})` with `router.push('/building-hours/location/[location]')`
- [x] Verify the favorite toggle works correctly with the location name string from params

### Phase 8: Cleanup

- [x] **8.1 Remove old navigation infrastructure**
  - [x] Delete `src/navigation/routes.tsx`
  - [x] Delete `src/navigation/types.tsx`
  - [x] ~~Delete or remove the `src/navigation/` directory if empty~~ — kept for `persistenceKey` export from `constants.ts`
  - [x] ~~Remove `modules/navigation-tabs/tabbed-view.tsx`~~ — kept as workspace package (pre-existing, not imported by migrated code)
  - [x] ~~Remove `modules/navigation-tabs/tabbar-icon.tsx`~~ — kept as workspace package (pre-existing)

- [x] **8.2 Remove old imports across the codebase**
  - [x] Search for all remaining `from '@react-navigation/native'` imports in `src/views/` and `modules/` — removed `useRoute`, `RouteProp`, `useNavigation` (kept `ThemeProvider` in `_layout.tsx`)
  - [x] Search for all remaining `from '@react-navigation/native-stack'` imports — removed `NativeStackNavigationOptions`, `NativeStackNavigationProp` types
  - [x] Search for all remaining `from '../../navigation/types'` or `../navigation/types` imports — removed `RootStackParamList`, `SettingsStackParamList`, `ComponentLibraryStackParamList`
  - [x] Search for all remaining `source/navigation/types` imports in `modules/` — removed and replaced
  - [x] Remove the `ReactNavigation` global type augmentation (was in `types.tsx`, now deleted)

- [x] **8.3 Update build configuration**
  - [x] Update `package.json` `lint` script — change `source/` to `src/`
  - [x] Update `package.json` `start` script — change `react-native start` to `expo start`
  - [x] Update `package.json` `pretty` script — change `source` to `src`
  - [x] Check `.github/workflows/check.yml` — updated `source/` to `src/` in cache key hash patterns

- [x] **8.4 Remove unused dependencies**
  - [x] Check if `@react-navigation/bottom-tabs` is still imported anywhere — not listed as explicit dependency; only used in unused `navigation-tabs` module
  - [x] Check if `@react-navigation/native-stack` is still imported anywhere — not listed as explicit dependency; no imports remain
  - [x] Check if `createNativeStackNavigator` is still used — no imports remain
  - [x] `@react-navigation/native` and `@react-navigation/elements` still in use (ThemeProvider, useTheme, PlatformPressable) — kept

- [x] **8.5 Final verification**
  - [x] Run TypeScript type-check (`pnpm tsc --noEmit`) — only 3 pre-existing errors remain (none introduced by migration)
  - [x] Run linter (`pnpm lint`) — pre-existing ESLint config issue (`eslint-config-expo/flat` ESM directory import); not caused by migration
  - [x] Run tests (`pnpm test`) — pre-existing Jest config issue (RN 0.81 setup uses ESM `import` syntax Jest can't handle); not caused by migration
  - [ ] ~~Manually verify all home screen buttons navigate to the correct screens~~ — requires running device/simulator
  - [ ] ~~Verify settings modal opens and closes correctly~~ — requires running device/simulator
  - [ ] ~~Verify all tab layouts render with correct tabs and icons~~ — requires running device/simulator
  - [ ] ~~Verify detail screen navigation works (list → detail → back) for each feature~~ — requires running device/simulator
  - [ ] ~~Verify deep linking works for key routes~~ — requires running device/simulator
