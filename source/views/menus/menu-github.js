// @flow
import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
import type {TopLevelViewPropsType} from '../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
import sample from 'lodash/sample'
import fromPairs from 'lodash/fromPairs'
import filter from 'lodash/filter'
import type {
	MenuItemType,
	MasterCorIconMapType,
	StationMenuType,
	MenuItemContainerType,
	ProcessedMealType,
} from './types'
import {upgradeMenuItem, upgradeStation} from './lib/process-menu-shorthands'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'

type Props = TopLevelViewPropsType & {
	name: string,
	loadingMessage: string[],
}

type State = {
	error: ?Error,
	loading: boolean,
	now: momentT,
	foodItems: MenuItemContainerType,
	corIcons: MasterCorIconMapType,
	meals: ProcessedMealType[],
}

export class GitHubHostedMenu extends React.PureComponent<Props, State> {
	state = {
		error: null,
		loading: true,
		now: moment.tz(timezone()),
		foodItems: {},
		corIcons: {},
		meals: [],
	}

	componentDidMount() {
		this.fetchData()
	}

	fetchData = async () => {
		this.setState({loading: true})

		let container = await fetch(API('/food/named/menu/the-pause')).json()

		let data = container.data
		let foodItems: MenuItemType[] = data.foodItems || []
		let stationMenus: StationMenuType[] = data.stationMenus || []
		let corIcons: MasterCorIconMapType = data.corIcons || {}

		let upgradedFoodItems = fromPairs(
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
			now: moment.tz(timezone()),
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
