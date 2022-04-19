import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import type {
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from './types'
import type {
	NavigationAction,
	NavigationRoute,
	NavigationScreenProp,
} from 'react-navigation'
import size from 'lodash/size'
import {ListSectionHeader, ListSeparator} from '@frogpond/lists'
import type {FilterType} from '@frogpond/filter'
import {applyFiltersToItem} from '@frogpond/filter'
import {NoticeView} from '@frogpond/notice'
import {FilterMenuToolbar as FilterToolbar} from './filter-menu-toolbar'
import {FoodItemRow} from './food-item-row'
import {chooseMeal} from './lib/choose-meal'
import {buildFilters} from './lib/build-filters'
import type {Moment} from 'moment'

type ReactProps = {
	cafeMessage?: string
	foodItems: MenuItemContainerType
	meals: ProcessedMealType[]
	menuCorIcons: MasterCorIconMapType
	name: string
	now: Moment
	onRefresh?: () => void
	refreshing?: boolean
}

type FilterFunc = (filters: Array<FilterType>, item: MenuItemType) => boolean

type DefaultProps = {
	applyFilters: FilterFunc
	navigation: NavigationScreenProp<NavigationRoute, NavigationAction>
}

type Props = ReactProps & DefaultProps

type State = {
	filters: Array<FilterType>
	cachedFoodItems?: MenuItemContainerType
}

const styles = StyleSheet.create({
	inner: {
		backgroundColor: c.white,
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

export class FancyMenu extends React.Component<Props, State> {
	static defaultProps = {
		applyFilters: applyFiltersToItem,
	}

	state: State = {
		filters: [],
		cachedFoodItems: undefined,
	}

	static getDerivedStateFromProps(
		props: Props,
		prevState: State,
	): State | null {
		// we only need to do this when the menu has changed; this avoids
		// us overriding our changes from FilterView.onDismiss
		if (
			!prevState.cachedFoodItems ||
			props.foodItems !== prevState.cachedFoodItems
		) {
			const {foodItems, menuCorIcons, meals, now} = props
			const filters =
				prevState.filters.length !== 0
					? prevState.filters
					: buildFilters(Object.values(foodItems), menuCorIcons, meals, now)
			return {filters, cachedFoodItems: props.foodItems}
		}
		return null
	}

	areSpecialsFiltered = (filters: Array<FilterType>): boolean =>
		Boolean(filters.find(this.isSpecialsFilter))

	isSpecialsFilter = (f: FilterType): boolean =>
		f.enabled && f.type === 'toggle' && f.spec.label === 'Only Show Specials'

	updateFilter = (filter: FilterType): void => {
		this.setState((state) => {
			const edited = state.filters.map((f) =>
				f.key !== filter.key ? f : filter,
			)
			return {filters: edited}
		})
	}

	groupMenuData = (args: {
		filters: Array<FilterType>
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

	render(): JSX.Element {
		const {now, meals, cafeMessage, applyFilters, foodItems} = this.props
		const {filters} = this.state

		const {label: mealName, stations} = chooseMeal(meals, filters, now)
		const anyFiltersEnabled = filters.some((f) => f.enabled)
		const specialsFilterEnabled = this.areSpecialsFiltered(filters)
		const groupedMenuData = this.groupMenuData({
			stations,
			filters,
			applyFilters,
			foodItems,
		})

		let message = 'No items to show.'
		if (cafeMessage) {
			message = cafeMessage
		} else if (specialsFilterEnabled && stations.length === 0) {
			message =
				'No items to show. There may be no specials today. Try changing the filters.'
		} else if (anyFiltersEnabled && !size(groupedMenuData)) {
			message = 'No items to show. Try changing the filters.'
		}

		const messageView = <NoticeView style={styles.message} text={message} />

		// If the requested menu has no food items, that location is closed
		const isOpen = Object.keys(foodItems).length !== 0

		const header = (
			<FilterToolbar
				date={now}
				filters={filters}
				isOpen={isOpen}
				onPopoverDismiss={this.updateFilter}
				title={mealName}
			/>
		)

		const navigate = this.props.navigation.navigate

		return (
			<SectionList
				ItemSeparatorComponent={Separator}
				ListEmptyComponent={messageView}
				ListHeaderComponent={header}
				contentContainerStyle={styles.contentContainer}
				extraData={filters}
				keyExtractor={(_item, index) => index.toString()}
				onRefresh={this.props.onRefresh}
				refreshing={this.props.refreshing}
				renderItem={({item}) => {
					const specialsFilterEnabled = this.areSpecialsFiltered(
						this.state.filters,
					)
					const icons = this.props.menuCorIcons
					return (
						<FoodItemRow
							badgeSpecials={!specialsFilterEnabled}
							corIcons={icons}
							data={item}
							onPress={() => navigate('MenuItemDetailView', {item, icons})}
							spacing={{left: LEFT_MARGIN}}
						/>
					)
				}}
				renderSectionHeader={(info): JSX.Element => {
					const title = info.section.title
					const {now, meals} = this.props
					const {filters} = this.state
					const {stations} = chooseMeal(meals, filters, now)
					const menu = stations.find((m) => m.label === title)

					return (
						<ListSectionHeader
							spacing={{left: LEFT_MARGIN}}
							subtitle={menu ? menu.note : ''}
							title={title}
						/>
					)
				}}
				sections={groupedMenuData}
				style={styles.inner}
				windowSize={5}
			/>
		)
	}
}
