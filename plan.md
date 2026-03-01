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
