import * as React from 'react'
import {useMemo, useState} from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, RNHostView, Section, Text, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle, listStyle, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {FilterType} from '@frogpond/filter'
import {applyFiltersToItem} from '@frogpond/filter'
import type {Moment} from 'moment'

import {FilterMenuToolbar as FilterToolbar} from './filter-menu-toolbar'
import {FoodItemRow} from './food-item-row'
import {buildFilters} from './lib/build-filters'
import {chooseMeal} from './lib/choose-meal'
import {emptyMessage} from './lib/empty-message'
import {useLocalCorIcons} from './lib/use-local-cor-icons'
import type {
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from './types'

type FilterFunc = (filters: Array<FilterType<MenuItemType>>, item: MenuItemType) => boolean

type Props = {
	cafeMessage?: string | null
	foodItems: MenuItemContainerType
	meals: ProcessedMealType[]
	menuCorIcons: MasterCorIconMapType
	name: string
	now: Moment
	onItemPress: (item: MenuItemType) => void
	// `unknown` rather than `void`: the real callers (menu-bonapp.tsx,
	// menu-github.tsx's `refetch`) return a promise, and `refreshable` below
	// needs to await that promise to keep the spinner up until it resolves.
	onRefresh?: () => unknown
	refreshing?: boolean
	applyFilters?: FilterFunc
}

// --- unchanged from the React Native implementation ------------------------
// Reproduced in full rather than referenced: whoever executes this task may be
// reading it without the old file in front of them, and these decide which
// items survive filtering, which is not something to reconstruct from memory.

const areSpecialsFiltered = (filters: Array<FilterType<MenuItemType>>): boolean =>
	Boolean(filters.find(isSpecialsFilter))

const isSpecialsFilter = (f: FilterType<MenuItemType>): boolean =>
	f.enabled && f.type === 'toggle' && f.spec.label === 'Only Show Specials'

const areDietsFiltered = (filters: Array<FilterType<MenuItemType>>): boolean =>
	Boolean(filters.find(isDietsFilter))

const isDietsFilter = (f: FilterType<MenuItemType>): boolean =>
	f.enabled && f.type === 'list' && f.spec.title === 'Dietary Restrictions'

const groupMenuData = (args: {
	filters: Array<FilterType<MenuItemType>>
	stations: Array<StationMenuType>
	foodItems: MenuItemContainerType
	applyFilters: FilterFunc
}): {title: string; data: Array<MenuItemType>}[] => {
	const {applyFilters, foodItems, stations, filters} = args

	const dietsFilterEnabled = areDietsFiltered(filters)

	const dereferenceMenuItems = (menu: StationMenuType) =>
		menu.items
			// Dereference each menu item
			.map((id) => foodItems[id])
			// Ensure that the referenced menu items exist,
			// and apply the selected filters to the items in the menu
			.filter((item) => {
				// Ensure that items with dietary data are the only
				// items being shown when a diet filter is enabled
				if (dietsFilterEnabled) {
					return !item?.cor_icon?.entries && applyFilters(filters, item)
				}

				return item && applyFilters(filters, item)
			})

	const stationMenusByLabel: [string, MenuItemType[]][] = stations.map((menu: StationMenuType) => [
		menu.label,
		dereferenceMenuItems(menu),
	])

	return stationMenusByLabel
		.filter(([_, items]) => items.length)
		.map(([title, data]) => ({title, data}))
}
// --- end unchanged ---------------------------------------------------------

/**
 * A station's header. Most stations are just a name, which `Section`'s own
 * `title` renders in the system's section-header style -- preferred, so the
 * screen looks like a system list rather than a bespoke one. Only a station
 * carrying a `note` needs a custom node, and even then the name keeps the
 * system's own treatment.
 *
 * A bare string may never be passed as a `ReactNode` prop: `@expo/ui` crashes
 * at mount, and neither tsc nor Jest catches it.
 */
function sectionHeaderProps(
	title: string,
	note: string | undefined,
): {title: string} | {header: React.ReactNode} {
	if (!note) {
		return {title}
	}

	return {
		header: (
			<VStack alignment="leading" spacing={2}>
				<Text>{title}</Text>
				<Text modifiers={[font({textStyle: 'footnote'}), foregroundStyle(c.secondaryLabel)]}>
					{note}
				</Text>
			</VStack>
		),
	}
}

export function FancyMenu(props: Props): React.ReactNode {
	const {now, meals, cafeMessage, foodItems, menuCorIcons, onItemPress} = props
	const applyFilters = props.applyFilters ?? applyFiltersToItem

	const localIcons = useLocalCorIcons(menuCorIcons)

	// Built from the menu once, then owned by the user. Unchanged from the
	// React Native implementation -- see that comment for why `now` is read
	// only for the initial meal.
	const [filters, setFilters] = useState<FilterType<MenuItemType>[]>(() =>
		buildFilters(Object.values(foodItems), menuCorIcons, meals, now),
	)

	const meal = chooseMeal(meals, filters, now)
	const {label: mealName, stations} = meal
	const stationsByLabel = useMemo(
		() => new Map(stations.map((station) => [station.label, station])),
		[stations],
	)

	const groupedMenuData = useMemo(
		() => groupMenuData({stations, filters, applyFilters, foodItems}),
		[stations, filters, applyFilters, foodItems],
	)

	// Reading `stationsByLabel.get(...)` straight from a `.map()` that builds
	// JSX children -- rather than from a prop callback, as `renderSectionHeader`
	// used to -- reads as a possible mutation of `stations` to the compiler and
	// makes it give up on `groupedMenuData`'s memoization above. Resolving each
	// section's note here, once, keeps that lookup out of the render tree.
	const sectionsWithNotes = useMemo(
		() =>
			groupedMenuData.map((section) => ({
				...section,
				note: stationsByLabel.get(section.title)?.note,
			})),
		[groupedMenuData, stationsByLabel],
	)

	const specialsFilterEnabled = areSpecialsFiltered(filters)
	const message = emptyMessage({
		cafeMessage,
		specialsOnly: specialsFilterEnabled,
		anyFilters: filters.some((f) => f.enabled),
		sectionCount: groupedMenuData.length,
		stationCount: stations.length,
	})

	// If the requested menu has no food items, that location is closed.
	const isOpen = Object.keys(foodItems).length !== 0

	return (
		<Host style={styles.host}>
			<VStack spacing={0}>
				{/* Still React Native until #7804 replaces the filter popovers. */}
				<RNHostView matchContents={true}>
					<FilterToolbar
						date={now}
						filters={filters}
						isOpen={isOpen}
						onPopoverDismiss={(newFilter) => {
							setFilters(filters.map((f) => (f.key === newFilter.key ? newFilter : f)))
						}}
						title={mealName}
					/>
				</RNHostView>

				<List
					modifiers={[
						// `plain` is what pins the station headers, matching
						// SectionList's stickySectionHeadersEnabled default on iOS.
						listStyle('plain'),
						...(props.onRefresh
							? [
									refreshable(async () => {
										await props.onRefresh?.()
									}),
								]
							: []),
					]}
				>
					{sectionsWithNotes.length === 0 ? (
						<Text modifiers={[foregroundStyle(c.secondaryLabel), padding({vertical: 16})]}>
							{message}
						</Text>
					) : (
						sectionsWithNotes.map((section) => (
							<Section key={section.title} {...sectionHeaderProps(section.title, section.note)}>
								{section.data.map((item) => (
									<FoodItemRow
										key={item.id}
										badgeSpecials={!specialsFilterEnabled}
										corIcons={menuCorIcons}
										data={item}
										localIcons={localIcons}
										onPress={() => onItemPress(item)}
									/>
								))}
							</Section>
						))
					)}
				</List>
			</VStack>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
