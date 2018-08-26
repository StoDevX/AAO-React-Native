// @flow
import * as React from 'react'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
import {type NavigationScreenProp} from 'react-navigation'
import type momentT from 'moment'
import moment from 'moment-timezone'
import sample from 'lodash/sample'
import fromPairs from 'lodash/fromPairs'
import filter from 'lodash/filter'
import {
	upgradeMenuItem,
	upgradeStation,
	type MenuItemType,
	type MasterCorIconMapType,
	type StationMenuType,
	type MenuItemContainerType,
	type ProcessedMealType,
} from '@frogpond/ccc-bonapp-menu'
import {reportNetworkProblem} from '@frogpond/analytics'

const CENTRAL_TZ = 'America/Winnipeg'

type Props = {
	name: string,
	loadingMessage: string[],
	navigation: NavigationScreenProp<*>,
	url: string,
	fallbackData: {
		foodItems: Array<MenuItemType>,
		stationMenus: Array<StationMenuType>,
		corIcons: MasterCorIconMapType,
	},
}

type State = {
	error: ?Error,
	loading: boolean,
	now: momentT,
	foodItems: MenuItemContainerType,
	corIcons: MasterCorIconMapType,
	meals: ProcessedMealType[],
}

export class StaticFoodMenu extends React.PureComponent<Props, State> {
	state = {
		error: null,
		loading: true,
		now: moment.tz(CENTRAL_TZ),
		foodItems: {},
		corIcons: {},
		meals: [],
	}

	componentDidMount() {
		this.fetchData()
	}

	fetchData = async () => {
		this.setState({loading: true})

		let foodItems: MenuItemType[] = []
		let stationMenus: StationMenuType[] = []
		let corIcons: MasterCorIconMapType = {}
		try {
			let container = await fetchJson(this.props.url)
			let data = container.data
			foodItems = data.foodItems || []
			stationMenus = data.stationMenus || []
			corIcons = data.corIcons || {}
		} catch (err) {
			reportNetworkProblem(err)
			console.warn(err)
			foodItems = this.props.fallbackData.foodItems || []
			stationMenus = this.props.fallbackData.stationMenus || []
			corIcons = this.props.fallbackData.corIcons || {}
		}

		if (process.env.NODE_ENV === 'development') {
			foodItems = this.props.fallbackData.foodItems
			stationMenus = this.props.fallbackData.stationMenus
			corIcons = this.props.fallbackData.corIcons
		}

		const upgradedFoodItems = fromPairs(
			foodItems.map(upgradeMenuItem).map(item => [item.id, item]),
		)
		stationMenus = stationMenus.map((menu, index) => ({
			...upgradeStation(menu, index),
			items: filter(upgradedFoodItems, item => item.station === menu.label).map(
				item => item.id,
			),
		}))

		this.setState({
			loading: false,
			corIcons,
			foodItems: upgradedFoodItems,
			meals: [
				{
					label: 'Menu',
					stations: stationMenus,
					starttime: '0:00',
					endtime: '23:59',
				},
			],
			now: moment.tz(CENTRAL_TZ),
		})
	}

	render() {
		if (this.state.loading) {
			return <LoadingView text={sample(this.props.loadingMessage)} />
		}

		if (this.state.error) {
			return <NoticeView text={`Error: ${this.state.error.message}`} />
		}

		return (
			<FoodMenu
				foodItems={this.state.foodItems}
				meals={this.state.meals}
				menuCorIcons={this.state.corIcons}
				name={this.props.name}
				navigation={this.props.navigation}
				now={this.state.now}
			/>
		)
	}
}
