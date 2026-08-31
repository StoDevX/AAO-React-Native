import * as React from 'react'
import {useMemo, useState} from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, RNHostView, Section, Text, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle, listStyle, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {FilterType} from '@frogpond/filter'
import type {Moment} from 'moment'

import {FilterMenuToolbar as FilterToolbar} from './filter-menu-toolbar'
import {FoodItemRow} from './food-item-row'
import {applyMenuFilters} from './lib/apply-menu-filters'
import {buildFilters} from './lib/build-filters'
import {chooseMeal} from './lib/choose-meal'
import {emptyMessage} from './lib/empty-message'
import {offerSpecials} from './lib/offer-specials'
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
	applyFilters?: FilterFunc
}

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
export function sectionHeaderProps(
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
	const applyFilters = props.applyFilters ?? applyMenuFilters

	// Built from the menu once, then owned by the user. `now` picks the meal
	// selected to begin with and nothing after: the screens above build a fresh
	// Moment on each of their renders, so anything tracking it would follow
	// every one of them and take the user's filters with it.
	const [filters, setFilters] = useState<FilterType<MenuItemType>[]>(() =>
		buildFilters(Object.values(foodItems), menuCorIcons, meals, now),
	)

	const meal = chooseMeal(meals, filters, now)
	const {label: mealName, stations} = meal

	// Depends on the meal, not on the filters, so it is not rebuilt every time
	// the user toggles something unrelated. What the answer is used for is
	// `offerSpecials`' business.
	const mealHasSpecials = useMemo(
		() => stations.some((station) => station.items.some((id) => foodItems[id]?.special)),
		[stations, foodItems],
	)

	const appliedFilters = useMemo(
		() => offerSpecials(filters, mealHasSpecials),
		[filters, mealHasSpecials],
	)

	const groupedMenuData = useMemo(
		() => groupMenuData({stations, filters: appliedFilters, applyFilters, foodItems}),
		[stations, appliedFilters, applyFilters, foodItems],
	)

	// Resolving each section's note here rather than inside the `.map()` that
	// builds the JSX: a `Map.get()` read from within that map reads as a
	// possible mutation of `stations` to the compiler, and it responds by
	// giving up on `groupedMenuData`'s memoization above.
	const sectionsWithNotes = useMemo(() => {
		const stationsByLabel = new Map(stations.map((station) => [station.label, station]))
		return groupedMenuData.map((section) => ({
			...section,
			note: stationsByLabel.get(section.title)?.note,
		}))
	}, [groupedMenuData, stations])

	const specialsFilterEnabled = areSpecialsFiltered(appliedFilters)
	const message = emptyMessage({
		cafeMessage,
		specialsOnly: specialsFilterEnabled,
		anyFilters: appliedFilters.some((f) => f.enabled),
		sectionCount: groupedMenuData.length,
		stationCount: stations.length,
	})

	// If the requested menu has no food items, that location is closed.
	const isOpen = Object.keys(foodItems).length !== 0

	return (
		<Host style={styles.host}>
			<VStack spacing={0}>
				{/* The date bar this toolbar carries is React Native, so it still needs
				    an `RNHostView` bridge into the SwiftUI tree around it. */}
				<RNHostView matchContents={true}>
					<FilterToolbar
						date={now}
						filters={appliedFilters}
						isOpen={isOpen}
						onChange={(newFilter) => {
							setFilters(filters.map((f) => (f.key === newFilter.key ? newFilter : f)))
						}}
						title={mealName}
					/>
				</RNHostView>

				<List
					modifiers={[
						// Inset groups, as Settings has them: cards on the grouped
						// background rather than full-bleed rows. Section headers do
						// not pin in this style, and `plain` -- which does pin them --
						// is full-bleed; SwiftUI offers no style that is both.
						listStyle('insetGrouped'),
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
										onPress={onItemPress}
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
		backgroundColor: c.systemGroupedBackground,
	},
})
