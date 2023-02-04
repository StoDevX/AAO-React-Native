import React from 'react'
import {useState, useMemo} from 'react'
import {SectionList, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import type {
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from './types'
import size from 'lodash/size'
import {ListSectionHeader, ListSeparator} from '@frogpond/lists'
import {Filter, FilterToolbar, isFilterEnabled} from '@frogpond/filter'
import {applyFiltersToItem} from '@frogpond/filter'
import {NoticeView} from '@frogpond/notice'
import {FilterMenuToolbar} from './filter-menu-toolbar'
import {FoodItemRow} from './food-item-row'
import {buildFilters, SPECIALS_FILTER_NAME} from './lib/build-filters'
import {useNavigation} from '@react-navigation/native'
import type {Moment} from 'moment'
import {findMeal} from './lib/find-menu'

type FilterFunc = (
	filters: Array<Filter<MenuItemType>>,
	item: MenuItemType,
) => boolean

export const EMPTY_MEAL: ProcessedMealType = {
	label: '',
	stations: [],
	starttime: '0:00',
	endtime: '0:00',
}

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

type Props = ReactProps

const styles = StyleSheet.create({
	inner: {
		backgroundColor: c.separator,
	},
	message: {
		paddingVertical: 16,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

const LEFT_MARGIN = 28
const Separator = () => <ListSeparator spacing={{left: LEFT_MARGIN}} />

const areSpecialsFiltered = (filters: Filter<MenuItemType>[]): boolean =>
	filters.some(
		(f) => f.type === 'toggle' && f.active && f.title === SPECIALS_FILTER_NAME,
	)

const groupMenuData = (args: {
	filters: Array<Filter<MenuItemType>>
	stations: Array<StationMenuType>
	foodItems: MenuItemContainerType
	applyFilters: FilterFunc
}): {title: string; data: Array<MenuItemType>}[] => {
	const {applyFilters, foodItems, stations, filters} = args

	const dereferenceMenuItems = (menu: StationMenuType) =>
		menu.items
			// Dereference each menu item
			.map((id) => foodItems[id])
			// Ensure that the referenced menu items exist,
			// and apply the selected filters to the items in the menu
			.filter((item) => item && applyFilters(filters, item))

	const stationMenusByLabel: [string, MenuItemType[]][] = stations.map(
		(menu: StationMenuType) => [menu.label, dereferenceMenuItems(menu)],
	)

	return stationMenusByLabel
		.filter(([_, items]) => items.length)
		.map(([title, data]) => ({title, data}))
}

export function FancyMenu(props: Props): JSX.Element {
	let navigation = useNavigation()

	let {now, meals, cafeMessage, foodItems, menuCorIcons} = props
	let applyFilters = props.applyFilters ?? applyFiltersToItem

	let [selectedMeal, setSelectedMeal] = useState(() => findMeal(meals, now))
	let [filters, setFilters] = useState(() =>
		buildFilters(Object.values(foodItems), menuCorIcons, selectedMeal),
	)

	const anyFiltersEnabled = filters.some(isFilterEnabled)
	const specialsFilterEnabled = areSpecialsFiltered(filters)

	const {label: mealName, stations} = selectedMeal || EMPTY_MEAL
	const stationsByLabel = Object.fromEntries(
		stations.map((station) => [station.label, station]),
	)

	// re-group the food when the data changes
	let groupedMenuData = useMemo(
		() => groupMenuData({stations, filters, applyFilters, foodItems}),
		[applyFilters, filters, foodItems, stations],
	)

	let message = 'No items to show.'
	if (cafeMessage) {
		message = cafeMessage
	} else if (specialsFilterEnabled && stations.length === 0) {
		message =
			'No items to show. There may be no specials today. Try changing the filters.'
	} else if (anyFiltersEnabled && !size(groupedMenuData)) {
		message = 'No items to show. Try changing the filters.'
	}

	// If the requested menu has no food items, that location is closed
	const isOpen = Object.keys(foodItems).length !== 0

	const header = (
		<>
			<FilterMenuToolbar
				date={now}
				isOpen={isOpen}
				meals={meals}
				onMealSelection={setSelectedMeal}
				selectedMeal={selectedMeal}
				title={mealName}
			/>
			<FilterToolbar filters={filters} onChange={setFilters} />
		</>
	)

	return (
		<SectionList
			ItemSeparatorComponent={Separator}
			ListEmptyComponent={<NoticeView style={styles.message} text={message} />}
			ListHeaderComponent={header}
			contentContainerStyle={styles.contentContainer}
			extraData={filters}
			keyExtractor={(item: MenuItemType) => item.id}
			onRefresh={props.onRefresh}
			refreshing={props.refreshing}
			renderItem={({item}) => {
				return (
					<FoodItemRow
						badgeSpecials={!specialsFilterEnabled}
						corIcons={menuCorIcons}
						data={item}
						onPress={() =>
							navigation.navigate('MenuItemDetail', {item, icons: menuCorIcons})
						}
						spacing={{left: LEFT_MARGIN}}
					/>
				)
			}}
			renderSectionHeader={(info) => {
				const title = info.section.title

				return (
					<ListSectionHeader
						spacing={{left: LEFT_MARGIN}}
						subtitle={stationsByLabel[title]?.note ?? ''}
						title={title}
					/>
				)
			}}
			sections={groupedMenuData}
			style={styles.inner}
		/>
	)
}
