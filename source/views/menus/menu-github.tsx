import {useEffect, useState} from 'react'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
import type {TopLevelViewPropsType} from '../types'
import moment from 'moment-timezone'
import sample from 'lodash/sample'
import type {
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from './types'
import {upgradeMenuItem, upgradeStation} from './lib/process-menu-shorthands'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'
import groupBy from 'lodash/groupBy'

type Props = TopLevelViewPropsType & {
	name: string
	loadingMessage: string[]
}

export function GitHubHostedMenu(props: Props): JSX.Element {
	let [error, setError] = useState<Error | null>(null)
	let [loading, setLoading] = useState(true)
	let [now, setNow] = useState(moment.tz(timezone()))
	let [foodItems, setFoodItems] = useState<MenuItemContainerType>({})
	let [corIcons, setCorIcons] = useState<MasterCorIconMapType>({})
	let [meals, setMeals] = useState<ProcessedMealType[]>([])

	useEffect(() => {
		;(async () => {
			setLoading(true)

			let container: {
				data: {
					foodItems: MenuItemType[]
					stationMenus: StationMenuType[]
					corIcons: MasterCorIconMapType
				}
			}

			try {
				container = await fetch(API('/food/named/menu/the-pause')).json()
			} catch (error) {
				if (error instanceof Error) {
					setError(error)
				} else {
					setError(new Error('unknown error - not an Error'))
				}
				return
			}

			let data = container.data
			let foodItems: MenuItemType[] = data.foodItems || []
			let stationMenus: StationMenuType[] = data.stationMenus || []
			let corIcons: MasterCorIconMapType = data.corIcons || {}

			let upgradedFoodItems = foodItems.map(upgradeMenuItem)
			let upgradedFoodItemsMap = Object.fromEntries(
				upgradedFoodItems.map((item) => [item.id, item]),
			)
			let foodItemsByStation = groupBy(
				upgradedFoodItems,
				(item) => item.station,
			)

			stationMenus = stationMenus.map((menu, index) => ({
				...upgradeStation(menu, index),
				items: foodItemsByStation[menu.label]?.map((item) => item.id) ?? [],
			}))

			setCorIcons(corIcons)
			setFoodItems(upgradedFoodItemsMap)
			setMeals([
				{
					label: 'Menu',
					stations: stationMenus,
					starttime: '0:00',
					endtime: '23:59',
				},
			])
			setNow(moment.tz(timezone()))
			setLoading(false)
		})()
	})

	if (loading) {
		return <LoadingView text={sample(props.loadingMessage)} />
	}

	if (error) {
		return <NoticeView text={`Error: ${error.message}`} />
	}

	return (
		<FoodMenu
			foodItems={foodItems}
			meals={meals}
			menuCorIcons={corIcons}
			name={props.name}
			navigation={props.navigation}
			now={now}
		/>
	)
}
