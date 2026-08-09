# expo-router checkpoint 2, group PR 7: Menus

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Menus" home-grid tile: a 4-tab screen (Stav Hall,
The Cage, The Pause, Carleton) plus 4 Carleton cafe detail screens plus one
shared `MenuItemDetail` nutrition screen. Seventh group PR in checkpoint
2's stack, and architecturally the most involved one so far.

**Why this group is different:** every prior group was a mechanical
`navigation.navigate` → `router.push` translation. Menus can't be — its
tab bar is built with React Navigation's `createNativeBottomTabNavigator`
(from `@react-navigation/bottom-tabs/unstable`), which transitively
imports `@react-navigation/native` as a runtime value
(`node_modules/@react-navigation/bottom-tabs/src/unstable/*.tsx` all do).
That import alone trips Metro's SDK56 check once reachable from `app/`,
the same failure stoPrint hit — but unlike stoPrint's fix, there's no
drop-in import-source swap here, because `createNativeBottomTabNavigator`
*is* the tab bar implementation, not a compatibility shim around one.

**Decision (confirmed with Wren, verified working on-device by both a
research prototype and Wren's own manual testing):** convert the tab bar
to expo-router's own file-based `NativeTabs` (from
`expo-router/unstable-native-tabs`) — the officially-supported
expo-router-native equivalent. Confirmed API:

```tsx
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function Layout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="fork.knife" />
				<NativeTabs.Trigger.Label>Stav Hall</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			{/* ...one Trigger per sibling route file, name matching the filename */}
		</NativeTabs>
	)
}
```

`name` on each `Trigger` matches a sibling route file/segment in the same
directory (same convention expo-router's plain `Tabs` already uses) —
`name="index"` matches `index.tsx`, `name="the-cage"` matches
`the-cage.tsx`, and so on. `sf="..."` sets an SF Symbol icon by name
(confirmed: the existing icon names this app already uses —
`fork.knife`, `cup.and.saucer.fill`, `pawprint.fill`, `list.bullet` — are
valid SF Symbol names and type-check against `expo-router`'s `SFSymbol`
union as-is).

**Navigation topology (confirmed from `source/navigation/routes.tsx`,
unchanged by this plan): the tab bar only covers the 4 tab screens.**
Tapping into a Carleton cafe, or tapping a food item on ANY of the 6
menu-rendering screens, navigates to a screen registered as a *sibling*
of `Menus` in the outer stack — not nested inside a sub-navigator. That
means the tab bar disappears on those screens today, and this plan
preserves that: `CarletonBurtonMenu`/`CarletonLDCMenu`/`CarletonWeitzMenu`/
`CarletonSaylesMenu`/`MenuItemDetail` become route files that are
siblings of the tab group, not children of it — pushed to via absolute
paths (`router.push('/Menus/CarletonBurtonMenu')`, matching the
"absolute path pushes out of a nested layout to a sibling of an
ancestor" mechanism Directory's department drill-down already
established, just one level deeper here).

**`FancyMenu` (`modules/food-menu/fancy-menu.tsx`) gets decoupled from
navigation entirely**, not patched. It currently imports `useNavigation`
from `@react-navigation/native` directly and calls
`navigation.navigate('MenuItemDetail', {item, icons})` itself — a second,
independent source of the same SDK56 trip, since `FancyMenu` is shared
infrastructure used by every one of the 6 BonApp/GitHub-hosted menu
screens (not just Menus-group files). Rather than swap its import source
(the stoPrint-style fix), this plan gives it a new `onItemPress: (item:
MenuItemType) => void` prop and deletes its own navigation entirely —
`FancyMenu` becomes fully router-agnostic, which is also just better
separation of concerns for a shared, reusable list-rendering component.
Each of its two callers (`BonAppHostedMenu`, `GitHubHostedMenu`) supplies
its own `onItemPress` via `useRouter()`, matching the
"`source/views` (or here, a caller of a shared component) can call
`useRouter()` directly" precedent already established by Student Orgs,
Directory, and Dictionary.

**The `select`-based single-item lookup, extended to a third shape.**
`MenuItemDetail` needs the tapped `MenuItemType` plus the full
`MasterCorIconMapType` icon map — both already resolved once by whichever
screen the tap came from (BonApp-hosted cafe menu, or The Pause's
GitHub-hosted menu), via a query keyed by that screen's own cafe/source
identity. Two new derived queries in `source/views/menus/query.ts`,
sharing their exact `queryKey`/`queryFn` with the existing list queries
just like every prior group's pattern:

- `bonAppMenuItemOptions(cafeParam, itemId)` — shares
  `bonAppMenuOptions(cafeParam)`'s key/fetch, selects
  `{item: prepareFood(data)[itemId], icons: data.cor_icons}`.
  `prepareFood` moves from `menu-bonapp.tsx` (where it was a private,
  unexported function) into `query.ts`, exported, so both the screen and
  the new derived query call the same implementation — not two copies.
- `pauseMenuItemOptions(itemId)` — shares `pauseMenuOptions`'s key/fetch,
  reuses a newly-factored `transformPauseMenu(data)` function (the body of
  `pauseMenuOptions`'s existing `select`, extracted so it can be called a
  second time with a different final shape) and selects
  `{item: transformedData.foodItems[itemId], icons: transformedData.corIcons}`.

The URL carries three params: `source` (`'bonapp' | 'pause'`), `cafe`
(only meaningful when `source === 'bonapp'`), and `itemId`. The
`MenuItemDetail` page wrapper calls both `useQuery` hooks unconditionally
(hooks must not be called conditionally) with `enabled` gating on
`source`, and reads whichever one is actually enabled.

**Scope note:** `source/views/menus/dev-bonapp-picker.tsx` (a
dev-settings-only screen, registered separately from the `Menus` group in
`routes.tsx`, not part of the home-grid stack) is explicitly **out of
scope** for this plan — it is not touched, and its own
`navigation.navigate`/`BonAppHostedMenu` usage (with the `{id: string}`
cafe-param form, used only by this dev picker) is left exactly as-is.

## Global Constraints

- Branch `expo-router-home-menus`, stacked on `expo-router-home-stoprint`
  (PR #7674).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.
- `dev-bonapp-picker.tsx` is out of scope — do not modify it.

---

### Task 1: Wire the Menus tab bar, Carleton screens, and shared MenuItemDetail into expo-router

**Files:**
- Modify: `source/views/menus/index.tsx`
- Modify: `source/views/menus/carleton-menus.tsx`
- Modify: `source/views/menus/menu-bonapp.tsx`
- Modify: `source/views/menus/menu-github.tsx`
- Modify: `source/views/menus/query.ts`
- Modify: `modules/food-menu/fancy-menu.tsx`
- Modify: `modules/food-menu/food-item-detail.tsx`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/views/views.ts`
- Create: `app/(home)/Menus/_layout.tsx`
- Create: `app/(home)/Menus/(tabs)/_layout.tsx`
- Create: `app/(home)/Menus/(tabs)/index.tsx`
- Create: `app/(home)/Menus/(tabs)/the-cage.tsx`
- Create: `app/(home)/Menus/(tabs)/the-pause.tsx`
- Create: `app/(home)/Menus/(tabs)/carleton.tsx`
- Create: `app/(home)/Menus/MenuItemDetail.tsx`
- Create: `app/(home)/Menus/CarletonBurtonMenu.tsx`
- Create: `app/(home)/Menus/CarletonLDCMenu.tsx`
- Create: `app/(home)/Menus/CarletonWeitzMenu.tsx`
- Create: `app/(home)/Menus/CarletonSaylesMenu.tsx`

**Interfaces:**
- Consumes: `StavHallMenuView`, `TheCageMenuView`, `ThePauseMenuView`
  (newly exported from `source/views/menus/index.tsx`);
  `CarletonCafeIndex`, `CarletonBurtonMenuScreen`, `CarletonLDCMenuScreen`,
  `CarletonWeitzMenuScreen`, `CarletonSaylesMenuScreen`,
  `BurtonNavigationOptions`, `LDCNavigationOptions`,
  `WeitzNavigationOptions`, `SaylesNavigationOptions` from
  `carleton-menus.tsx`; `MenuItemDetailView` (new prop shape: `{item:
  MenuItemType; icons: MasterCorIconMapType}`), `DetailNavigationOptions`
  from `modules/food-menu/food-item-detail.tsx`; `bonAppMenuItemOptions`,
  `pauseMenuItemOptions` from `source/views/menus/query.ts`.
- Produces: `/Menus` (tab group, default tab Stav Hall),
  `/Menus/the-cage`, `/Menus/the-pause`, `/Menus/carleton` (all within the
  tab bar); `/Menus/MenuItemDetail`, `/Menus/CarletonBurtonMenu`,
  `/Menus/CarletonLDCMenu`, `/Menus/CarletonWeitzMenu`,
  `/Menus/CarletonSaylesMenu` (siblings of the tab group, tab bar hidden).

- [ ] **Step 1: Decouple `FancyMenu` from navigation**

In `modules/food-menu/fancy-menu.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import type {LegacyRootParamList} from '../../source/navigation/types'
```

with nothing (delete these two lines — no replacement import needed).

Replace:

```typescript
type ReactProps = {
	cafeMessage?: string | null
	foodItems: MenuItemContainerType
	meals: ProcessedMealType[]
	menuCorIcons: MasterCorIconMapType
	name: string
	now: Moment
	onRefresh?: () => void
	refreshing?: boolean
	applyFilters?: FilterFunc
}
```

with:

```typescript
type ReactProps = {
	cafeMessage?: string | null
	foodItems: MenuItemContainerType
	meals: ProcessedMealType[]
	menuCorIcons: MasterCorIconMapType
	name: string
	now: Moment
	onItemPress: (item: MenuItemType) => void
	onRefresh?: () => void
	refreshing?: boolean
	applyFilters?: FilterFunc
}
```

Replace:

```typescript
	const {now, meals, cafeMessage, foodItems, menuCorIcons} = props
	const applyFilters = props.applyFilters ?? applyFiltersToItem

	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	const [filters, setFilters] = useState<FilterType<MenuItemType>[]>([])
```

with:

```typescript
	const {now, meals, cafeMessage, foodItems, menuCorIcons, onItemPress} =
		props
	const applyFilters = props.applyFilters ?? applyFiltersToItem

	const [filters, setFilters] = useState<FilterType<MenuItemType>[]>([])
```

Replace:

```typescript
						onPress={() =>
							navigation.navigate('MenuItemDetail', {
								item,
								icons: menuCorIcons,
							})
						}
```

with:

```typescript
						onPress={() => onItemPress(item)}
```

Everything else in the file — filtering, grouping, the `SectionList`
render — is unchanged.

- [ ] **Step 2: Change `MenuItemDetailView` to accept `item`/`icons` as props**

In `modules/food-menu/food-item-detail.tsx`, replace:

```typescript
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../source/navigation/types'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export const DetailNavigationOptions: NativeStackNavigationOptions = {
	title: 'Nutrition',
}

export const MenuItemDetailView = (): React.ReactNode => {
	let route = useRoute<RouteProp<RootStackParamList, 'MenuItemDetail'>>()
	const {item, icons} = route.params
```

with:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import type {MenuItemType, MasterCorIconMapType} from './types'

export const DetailNavigationOptions: NativeStackNavigationOptions = {
	title: 'Nutrition',
}

type Props = {
	item: MenuItemType
	icons: MasterCorIconMapType
}

export const MenuItemDetailView = ({item, icons}: Props): React.ReactNode => {
```

Everything else in the file (the `ScrollView`/`DietaryTagsDetail`/
nutrition-details JSX) is unchanged.

- [ ] **Step 3: Add the shared `select`-based single-item queries**

In `source/views/menus/query.ts`, replace the whole file with:

```typescript
import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {groupBy, mapValues} from 'lodash'
import {decode, innerTextWithSpaces, parseHtml} from '@frogpond/html-lib'
import {toLaxTitleCase} from '@frogpond/titlecase'
import {trimItemLabel, trimStationName} from './lib/trim-names'
import {upgradeMenuItem, upgradeStation} from './lib/process-menu-shorthands'
import type {
	EditedBonAppCafeInfoType,
	EditedBonAppMenuInfoType,
	GithubMenuResponse,
	GithubMenuType,
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	StationMenuType,
} from './types'

export const menuKeys = {
	bonAppCcc: (cafePath: string) => ['cafe-menu', 'bonApp', cafePath] as const,
	hosted: (url: string) => ['cafe-menu', 'hosted', url] as const,
}

export const cafeKeys = {
	bonAppCcc: (cafePath: string) => ['cafe-info', 'bonApp', cafePath] as const,
	hosted: (url: string) => ['cafe-info', 'hosted', url] as const,
}

//
// BonApp
//

function buildMenuPath(cafeParam: string | {id: string}) {
	if (typeof cafeParam === 'string') {
		return `food/named/menu/${cafeParam}`
	} else if ('id' in cafeParam) {
		return `food/menu/${cafeParam.id}`
	} else {
		throw new Error(`Unexpected cafe parameter: ${cafeParam}`)
	}
}

function buildCafePath(cafeParam: string | {id: string}) {
	if (typeof cafeParam === 'string') {
		return `food/named/cafe/${cafeParam}`
	} else if ('id' in cafeParam) {
		return `food/cafe/${cafeParam.id}`
	} else {
		throw new Error(`Unexpected cafe parameter: ${cafeParam}`)
	}
}

// Cleans up BonApp's raw station/label/description text -- shared by the
// list screen (BonAppHostedMenu) and the single-item lookup below, so a
// tapped item's detail page renders identically to how it appeared in the
// list it was tapped from.
export function prepareFood(
	cafeMenu: EditedBonAppMenuInfoType,
): MenuItemContainerType {
	return mapValues(cafeMenu.items, (item) => ({
		...item,
		station: decode(toLaxTitleCase(trimStationName(item.station))),
		label: decode(trimItemLabel(item.label)),
		description: innerTextWithSpaces(parseHtml(item.description || '')),
	}))
}

async function fetchBonAppMenu(
	cafeParam: string | {id: string},
	signal?: AbortSignal,
): Promise<EditedBonAppMenuInfoType> {
	let response = await client.get(buildMenuPath(cafeParam), {signal}).json()
	return response as EditedBonAppMenuInfoType
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const bonAppCafeOptions = (cafeParam: string | {id: string}) =>
	queryOptions({
		queryKey: cafeKeys.bonAppCcc(buildCafePath(cafeParam)),
		queryFn: async ({signal}) => {
			let response = await client.get(buildCafePath(cafeParam), {signal}).json()
			return response as EditedBonAppCafeInfoType
		},
		staleTime: 1000 * 60 * 60, // 1 hour
	})

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const bonAppMenuOptions = (cafeParam: string | {id: string}) =>
	queryOptions({
		queryKey: menuKeys.bonAppCcc(buildMenuPath(cafeParam)),
		queryFn: ({signal}) => fetchBonAppMenu(cafeParam, signal),
		staleTime: 1000 * 60 * 60, // 1 hour
	})

export const bonAppMenuItemOptions = (
	cafeParam: string | {id: string},
	itemId: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: menuKeys.bonAppCcc(buildMenuPath(cafeParam)),
		queryFn: ({signal}) => fetchBonAppMenu(cafeParam, signal),
		staleTime: 1000 * 60 * 60, // 1 hour
		select: (data) => ({
			item: prepareFood(data)[itemId],
			icons: data.cor_icons,
		}),
	})

//
// The Pause
//

async function fetchPauseMenu({
	signal,
}: {
	signal: AbortSignal
}): Promise<GithubMenuResponse> {
	let response = await client
		.get('food/named/menu/the-pause', {signal})
		.json()
	return (response as {data: GithubMenuResponse}).data
}

function transformPauseMenu(data: GithubMenuResponse): GithubMenuType {
	let foodItems: MenuItemType[] = data?.foodItems || []
	let stationMenus: StationMenuType[] = data?.stationMenus || []
	let corIcons: MasterCorIconMapType = data?.corIcons || {}

	let upgradedFoodItems = foodItems.map(upgradeMenuItem)
	let upgradedFoodItemsMap = Object.fromEntries(
		upgradedFoodItems.map((item) => [item.id, item]),
	)
	let foodItemsByStation = groupBy(upgradedFoodItems, (item) => item.station)

	stationMenus = stationMenus.map((menu, index) => ({
		...upgradeStation(menu, index),
		items: foodItemsByStation[menu.label]?.map((item) => item.id) ?? [],
	}))

	let meals = [
		{
			label: 'Menu',
			stations: stationMenus,
			starttime: '0:00',
			endtime: '23:59',
		},
	]

	return {
		foodItems: upgradedFoodItemsMap,
		corIcons: corIcons,
		meals,
	} as GithubMenuType
}

export const pauseMenuOptions = queryOptions({
	queryKey: menuKeys.hosted('food/named/menu/the-pause'),
	queryFn: fetchPauseMenu,
	select: transformPauseMenu,
})

export const pauseMenuItemOptions = (itemId: string) =>
	queryOptions({
		queryKey: menuKeys.hosted('food/named/menu/the-pause'),
		queryFn: fetchPauseMenu,
		select: (data) => {
			let {foodItems, corIcons} = transformPauseMenu(data)
			return {item: foodItems[itemId], icons: corIcons}
		},
	})
```

(`bonAppCafeOptions`, `bonAppMenuOptions`, and `pauseMenuOptions` are
otherwise unchanged in behavior. `prepareFood` moved here from
`menu-bonapp.tsx` unchanged, just exported. `pauseMenuOptions`'s `select`
body moved into `transformPauseMenu`, called by both `pauseMenuOptions`
and the new `pauseMenuItemOptions`.)

- [ ] **Step 4: Remove `prepareFood` from `menu-bonapp.tsx` and wire up `onItemPress`**

In `source/views/menus/menu-bonapp.tsx`, replace:

```typescript
import {trimItemLabel, trimStationName} from './lib/trim-names'
import {bonAppCafeOptions, bonAppMenuOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {decode, innerTextWithSpaces, parseHtml} from '@frogpond/html-lib'
import {toLaxTitleCase} from '@frogpond/titlecase'
```

with:

```typescript
import {bonAppCafeOptions, bonAppMenuOptions} from './query'
import {prepareFood} from './query'
import {useQuery} from '@tanstack/react-query'
import {useRouter} from 'expo-router'
```

(combine the two `from './query'` imports into one line:
`import {bonAppCafeOptions, bonAppMenuOptions, prepareFood} from
'./query'`.)

Delete the `prepareFood` function entirely (it now lives in `query.ts`):

```typescript
function prepareFood(cafeMenu: MenuInfoType) {
	return mapValues(cafeMenu.items, (item) => ({
		...item, // we want to edit the item, not replace it
		station: decode(toLaxTitleCase(trimStationName(item.station))), // <b>@station names</b> are a mess
		label: decode(trimItemLabel(item.label)), // clean up the titles
		description: innerTextWithSpaces(parseHtml(item.description || '')), // clean up the descriptions
	}))
}
```

(also remove `mapValues` from the `import {mapValues, reduce} from
'lodash'` line, leaving just `import {reduce} from 'lodash'`, since
`mapValues` was only used by the now-deleted function — `reduce` is
still used by `buildCustomStationMenu`.)

In the same file, replace:

```typescript
export function BonAppHostedMenu(props: Props): React.ReactNode {
	let now = moment.tz(timezone())
```

with:

```typescript
export function BonAppHostedMenu(props: Props): React.ReactNode {
	let now = moment.tz(timezone())
	let router = useRouter()
```

Replace:

```typescript
	return (
		<FoodMenu
			cafeMessage={specialMessage}
			foodItems={foodItems}
			meals={meals}
			menuCorIcons={cafeMenu.cor_icons}
			name={props.name}
			now={now}
			onRefresh={() => {
				cafeReload()
				menuReload()
			}}
			refreshing={refetching}
		/>
	)
```

with:

```typescript
	return (
		<FoodMenu
			cafeMessage={specialMessage}
			foodItems={foodItems}
			meals={meals}
			menuCorIcons={cafeMenu.cor_icons}
			name={props.name}
			now={now}
			onItemPress={(item) =>
				router.push({
					pathname: '/Menus/MenuItemDetail',
					params: {
						source: 'bonapp',
						cafe:
							typeof props.cafe === 'string' ? props.cafe : props.cafe.id,
						itemId: item.id,
					},
				})
			}
			onRefresh={() => {
				cafeReload()
				menuReload()
			}}
			refreshing={refetching}
		/>
	)
```

Everything else in the file (the two `useQuery` calls, loading/error
states, `findCafeMessage`, `buildCustomStationMenu`, `prepareSingleMenu`,
`getMeals`) is unchanged.

- [ ] **Step 5: Wire up `onItemPress` in `menu-github.tsx`**

In `source/views/menus/menu-github.tsx`, replace:

```typescript
import {pauseMenuOptions} from './query'
import {useQuery} from '@tanstack/react-query'
```

with:

```typescript
import {pauseMenuOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {useRouter} from 'expo-router'
```

Replace:

```typescript
export function GitHubHostedMenu(props: Props): React.ReactNode {
	let {
```

with:

```typescript
export function GitHubHostedMenu(props: Props): React.ReactNode {
	let router = useRouter()

	let {
```

Replace:

```typescript
	return (
		<FoodMenu
			foodItems={data.foodItems}
			meals={data.meals}
			menuCorIcons={data.corIcons}
			name={props.name}
			now={moment.tz(dataUpdatedAt, timezone())}
			onRefresh={refetch}
			refreshing={isRefetching}
		/>
	)
```

with:

```typescript
	return (
		<FoodMenu
			foodItems={data.foodItems}
			meals={data.meals}
			menuCorIcons={data.corIcons}
			name={props.name}
			now={moment.tz(dataUpdatedAt, timezone())}
			onItemPress={(item) =>
				router.push({
					pathname: '/Menus/MenuItemDetail',
					params: {source: 'pause', itemId: item.id},
				})
			}
			onRefresh={refetch}
			refreshing={isRefetching}
		/>
	)
```

- [ ] **Step 6: Swap Carleton's list navigation to `router.push`**

In `source/views/menus/carleton-menus.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {CafeMenuParamList, LegacyRootParamList} from '../../navigation/types'
```

with:

```typescript
import {useRouter} from 'expo-router'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
```

Replace:

```typescript
export function CarletonCafeIndex(): React.ReactNode {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	let carletonCafes: Array<{id: keyof CafeMenuParamList; title: string}> = [
		{id: 'CarletonBurtonMenu', title: 'Burton'},
		{id: 'CarletonLDCMenu', title: 'LDC'},
		{id: 'CarletonWeitzMenu', title: 'Weitz Center'},
		{id: 'CarletonSaylesMenu', title: 'Sayles Hill'},
	]
```

with:

```typescript
export function CarletonCafeIndex(): React.ReactNode {
	let router = useRouter()

	let carletonCafes = [
		{href: '/Menus/CarletonBurtonMenu', title: 'Burton'},
		{href: '/Menus/CarletonLDCMenu', title: 'LDC'},
		{href: '/Menus/CarletonWeitzMenu', title: 'Weitz Center'},
		{href: '/Menus/CarletonSaylesMenu', title: 'Sayles Hill'},
	] as const
```

Replace:

```typescript
					<ListRow
						arrowPosition="center"
						onPress={() => navigation.navigate(loc.id)}
					>
```

with:

```typescript
					<ListRow arrowPosition="center" onPress={() => router.push(loc.href)}>
```

Everything else in the file (the 4 `CarletonXMenuScreen` exports built on
`BonAppHostedMenu`, the styles, the 4 `NavigationOptions` exports) is
unchanged.

- [ ] **Step 7: Turn `source/views/menus/index.tsx` into a plain barrel of leaf view components**

Replace the whole file with:

```typescript
import * as React from 'react'

import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'

export {
	CarletonCafeIndex,
	CarletonBurtonMenuScreen,
	CarletonLDCMenuScreen,
	CarletonWeitzMenuScreen,
	CarletonSaylesMenuScreen,
	BurtonNavigationOptions,
	LDCNavigationOptions,
	WeitzNavigationOptions,
	SaylesNavigationOptions,
} from './carleton-menus'

export const StavHallMenuView = (): React.ReactNode => (
	<BonAppHostedMenu
		cafe="stav-hall"
		loadingMessage={[
			'Hunting Ferndale Turkey…',
			'Tracking wild vegan burgers…',
			'"Cooking" some lutefisk…',
			'Finding more mugs…',
			'Waiting for omelets…',
			'Putting out more cookies…',
		]}
		name="Stav Hall"
	/>
)

export const TheCageMenuView = (): React.ReactNode => (
	<BonAppHostedMenu
		cafe="the-cage"
		ignoreProvidedMenus={true}
		loadingMessage={[
			'Checking for vegan cookies…',
			'Serving up some shakes…',
			'Waiting for menu screens to change…',
			'Frying chicken…',
			'Brewing coffee…',
		]}
		name="The Cage"
	/>
)

export const ThePauseMenuView = (): React.ReactNode => (
	<GitHubHostedMenu
		loadingMessage={[
			'Mixing up a shake…',
			'Spinning up pizzas…',
			'Turning up the music…',
			'Putting ice cream on the cookies…',
			'Fixing the oven…',
		]}
		name="The Pause"
	/>
)
```

(`createNativeBottomTabNavigator`, `Params`, `Tab`, `View`,
`NavigationParams`, `NavigationKey`, `NavigationOptions` are all deleted —
dead once `routes.tsx` no longer references them, Step 8, and once
expo-router's file-based `NativeTabs` layout owns tab routing, Step 12.)

- [ ] **Step 8: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove these two import lines:

```typescript
import * as menus from '../views/menus'
import * as carletonmenus from '../views/menus/carleton-menus'
```

and this one (confirmed: `MenuItemDetailView`/`DetailNavigationOptions`
are used nowhere else in the file):

```typescript
import {
	DetailNavigationOptions,
	MenuItemDetailView,
} from '@frogpond/food-menu/food-item-detail'
```

Leave the `DevBonAppPickerView`/`DevBonAppNavigationOptions` import from
`'../views/menus/dev-bonapp-picker'` untouched — that screen is out of
scope for this plan and stays registered.

Remove the Menus `Stack.Group` block (`Menus`, all 4 Carleton screens,
`MenuItemDetail`):

```typescript
			<Stack.Group>
				<Stack.Screen
					component={menus.View}
					name={menus.NavigationKey}
					options={menus.NavigationOptions}
				/>
				<Stack.Screen
					component={menus.CarletonBurtonMenuScreen}
					name="CarletonBurtonMenu"
					options={carletonmenus.BurtonNavigationOptions}
				/>
				<Stack.Screen
					component={menus.CarletonLDCMenuScreen}
					name="CarletonLDCMenu"
					options={carletonmenus.LDCNavigationOptions}
				/>
				<Stack.Screen
					component={menus.CarletonSaylesMenuScreen}
					name="CarletonSaylesMenu"
					options={carletonmenus.SaylesNavigationOptions}
				/>
				<Stack.Screen
					component={menus.CarletonWeitzMenuScreen}
					name="CarletonWeitzMenu"
					options={carletonmenus.WeitzNavigationOptions}
				/>
				<Stack.Screen
					component={MenuItemDetailView}
					name="MenuItemDetail"
					options={DetailNavigationOptions}
				/>
			</Stack.Group>
```

Leave every other group's registration untouched, including the
`DevBonAppPickerView`/`DevBonAppNavigationOptions` registration elsewhere
in the file (out of scope, per this plan's Global Constraints).

- [ ] **Step 9: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`menus` entry.

- [ ] **Step 10: Create the outer Menus layout (Stack: tab group + siblings)**

Create `app/(home)/Menus/_layout.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	BurtonNavigationOptions,
	LDCNavigationOptions,
	WeitzNavigationOptions,
	SaylesNavigationOptions,
} from '../../../source/views/menus'
import {DetailNavigationOptions as MenuItemDetailNavigationOptions} from '../../../modules/food-menu/food-item-detail'

export default function MenusLayout(): React.ReactNode {
	return (
		<Stack>
			<Stack.Screen name="(tabs)" options={{headerShown: false}} />
			<Stack.Screen
				name="MenuItemDetail"
				options={
					MenuItemDetailNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<Stack.Screen
				name="CarletonBurtonMenu"
				options={
					BurtonNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<Stack.Screen
				name="CarletonLDCMenu"
				options={
					LDCNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<Stack.Screen
				name="CarletonWeitzMenu"
				options={
					WeitzNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<Stack.Screen
				name="CarletonSaylesMenu"
				options={
					SaylesNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
		</Stack>
	)
}
```

(`carleton-menus.tsx` has no `DetailNavigationOptions` export of its own —
only `BurtonNavigationOptions`, `LDCNavigationOptions`,
`WeitzNavigationOptions`, `SaylesNavigationOptions`. The `MenuItemDetail`
screen's options come from `modules/food-menu`'s own
`DetailNavigationOptions`, aliased on import to avoid a name collision
with the differently-shaped one that would otherwise exist if this file
also imported from `source/views/menus`.)

- [ ] **Step 11: Create the native tab bar layout**

Create `app/(home)/Menus/(tabs)/_layout.tsx`:

```typescript
import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function MenusTabsLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="fork.knife" />
				<NativeTabs.Trigger.Label>Stav Hall</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="the-cage">
				<NativeTabs.Trigger.Icon sf="cup.and.saucer.fill" />
				<NativeTabs.Trigger.Label>The Cage</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="the-pause">
				<NativeTabs.Trigger.Icon sf="pawprint.fill" />
				<NativeTabs.Trigger.Label>The Pause</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="carleton">
				<NativeTabs.Trigger.Icon sf="list.bullet" />
				<NativeTabs.Trigger.Label>Carleton</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

- [ ] **Step 12: Create the 4 tab route files**

Create `app/(home)/Menus/(tabs)/index.tsx`:

```typescript
import * as React from 'react'
import {StavHallMenuView} from '../../../../source/views/menus'

export default function StavHallPage(): React.ReactNode {
	return <StavHallMenuView />
}
```

Create `app/(home)/Menus/(tabs)/the-cage.tsx`:

```typescript
import * as React from 'react'
import {TheCageMenuView} from '../../../../source/views/menus'

export default function TheCagePage(): React.ReactNode {
	return <TheCageMenuView />
}
```

Create `app/(home)/Menus/(tabs)/the-pause.tsx`:

```typescript
import * as React from 'react'
import {ThePauseMenuView} from '../../../../source/views/menus'

export default function ThePausePage(): React.ReactNode {
	return <ThePauseMenuView />
}
```

Create `app/(home)/Menus/(tabs)/carleton.tsx`:

```typescript
import * as React from 'react'
import {CarletonCafeIndex} from '../../../../source/views/menus'

export default function CarletonPage(): React.ReactNode {
	return <CarletonCafeIndex />
}
```

(none of these 4 need their own `<Stack.Screen options={...}>` —
`NativeTabs` draws the tab bar and each leaf screen renders full-bleed
below it with no per-tab header, matching the original
`Tab.Navigator screenOptions={{headerShown: false}}` behavior exactly.)

- [ ] **Step 13: Create the shared MenuItemDetail route**

Create `app/(home)/Menus/MenuItemDetail.tsx`:

```typescript
import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {MenuItemDetailView} from '../../../modules/food-menu/food-item-detail'
import {
	bonAppMenuItemOptions,
	pauseMenuItemOptions,
} from '../../../source/views/menus/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function MenuItemDetailPage(): React.ReactNode {
	let {source, cafe, itemId} = useLocalSearchParams<{
		source: string
		cafe?: string
		itemId: string
	}>()

	let bonAppQuery = useQuery({
		...bonAppMenuItemOptions(cafe ?? '', itemId),
		enabled: source === 'bonapp',
	})

	let pauseQuery = useQuery({
		...pauseMenuItemOptions(itemId),
		enabled: source === 'pause',
	})

	let {data, isLoading, error, refetch} =
		source === 'bonapp' ? bonAppQuery : pauseQuery

	if (isLoading) {
		return <LoadingView />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (!data?.item) {
		return <NoticeView text="Could not find this menu item." />
	}

	return <MenuItemDetailView icons={data.icons} item={data.item} />
}
```

(both `useQuery` calls are unconditional — only their `enabled` flags
differ — respecting the rule that hooks can't be called conditionally.
When `source === 'bonapp'`, `pauseQuery` is disabled and its `data` stays
`undefined` without erroring or hanging in a loading state, same
`enabled`-gating behavior already relied on throughout the stoPrint
group's `printerByNameOptions`.)

- [ ] **Step 14: Create the 4 Carleton detail routes**

Create `app/(home)/Menus/CarletonBurtonMenu.tsx`:

```typescript
import * as React from 'react'
import {CarletonBurtonMenuScreen} from '../../../source/views/menus'

export default function CarletonBurtonMenuPage(): React.ReactNode {
	return <CarletonBurtonMenuScreen />
}
```

Create `app/(home)/Menus/CarletonLDCMenu.tsx`:

```typescript
import * as React from 'react'
import {CarletonLDCMenuScreen} from '../../../source/views/menus'

export default function CarletonLDCMenuPage(): React.ReactNode {
	return <CarletonLDCMenuScreen />
}
```

Create `app/(home)/Menus/CarletonWeitzMenu.tsx`:

```typescript
import * as React from 'react'
import {CarletonWeitzMenuScreen} from '../../../source/views/menus'

export default function CarletonWeitzMenuPage(): React.ReactNode {
	return <CarletonWeitzMenuScreen />
}
```

Create `app/(home)/Menus/CarletonSaylesMenu.tsx`:

```typescript
import * as React from 'react'
import {CarletonSaylesMenuScreen} from '../../../source/views/menus'

export default function CarletonSaylesMenuPage(): React.ReactNode {
	return <CarletonSaylesMenuScreen />
}
```

- [ ] **Step 15: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake; confirm via a clean
rerun before treating a failure as real).

- [ ] **Step 16: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or development variant), in
the FOREGROUND, genuinely waited on to completion.

Expected: home screen shows eight tiles now (Campus Map, More, Important
Contacts, Student Orgs, Directory, Campus Dictionary, stoPrint, Menus).
Tapping "Menus" shows a native tab bar with 4 tabs (Stav Hall, The Cage,
The Pause, Carleton), each with the correct SF Symbol icon, Stav Hall
selected by default. Tapping between tabs switches content without
losing the tab bar. Tapping "Carleton" shows a plain list of 4 cafes;
tapping one hides the tab bar and pushes to that cafe's menu, with a back
button returning to the Carleton list (still within the tab bar's
Carleton tab). Tapping any food item on any of the 6 menu-rendering
screens (Stav Hall, The Cage, The Pause, or any of the 4 Carleton cafes)
hides the tab bar and pushes to the nutrition detail screen, with a back
button returning to wherever the tap originated. No crash anywhere in
this flow.

BonApp-backed screens (Stav Hall, The Cage, all 4 Carleton cafes) and The
Pause both hit live network endpoints — note in the report whether real
menu data was reachable in this sandboxed environment, and if not,
confirm the loading/error states at minimum render correctly and
non-crashing.

Screenshot: home screen (eight tiles, no others), the Menus tab bar (Stav
Hall selected), at least one other tab, the Carleton list, a Carleton
cafe detail screen, and a MenuItemDetail screen (if reachable) — look at
each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 17: Commit**

```bash
git add source/views/menus/index.tsx source/views/menus/carleton-menus.tsx source/views/menus/menu-bonapp.tsx source/views/menus/menu-github.tsx source/views/menus/query.ts modules/food-menu/fancy-menu.tsx modules/food-menu/food-item-detail.tsx source/navigation/routes.tsx source/views/views.ts app/\(home\)/Menus/
git commit -m "Restore the Menus home-grid tile

Seventh group PR in checkpoint 2's stack, and the first tab-bar
group. createNativeBottomTabNavigator (React Navigation's own
implementation, not a compatibility shim) transitively imports
@react-navigation/native, so unlike every prior group's import-swap
fix, this one required converting the tab bar itself to
expo-router's file-based NativeTabs (expo-router/unstable-native-tabs)
-- confirmed working via an on-device prototype before writing this
plan, per Wren's direction.

FancyMenu (modules/food-menu/fancy-menu.tsx), shared by all 6
BonApp/GitHub-hosted menu screens, is decoupled from navigation
entirely via a new onItemPress callback prop rather than patched --
it was an independent source of the same SDK56 trip, and a shared
list-rendering component has no business owning routing decisions.

bonAppMenuItemOptions/pauseMenuItemOptions extend this stack's
established select-based single-item pattern to a third shape: two
different source screens (BonApp-hosted cafes, The Pause's
GitHub-hosted menu), each needing their own queryKey/queryFn pair,
converging on one shared MenuItemDetail route that reads a source
param to pick which query to enable.

source/navigation/routes.tsx's Menus registration (all 6 screens,
dead code, still type-checked) is removed in the same commit.
source/views/menus/dev-bonapp-picker.tsx (a separate dev-settings
screen, not part of this group) is untouched."
```

- [ ] **Step 18: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
