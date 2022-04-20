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
	let [error, seterror] = useState<Error | null>(null)
	let [loading, setloading] = useState(true)
	let [now, setnow] = useState(moment.tz(timezone()))
	let [foodItems, setfoodItems] = useState<MenuItemContainerType>({})
	let [corIcons, setcorIcons] = useState<MasterCorIconMapType>({})
	let [meals, setmeals] = useState<ProcessedMealType[]>([])

	useEffect(() => {
		;(async () => {
			setloading(true)

			let container
			try {
				container = await fetch(API('/food/named/menu/the-pause')).json<{
					data: {
						foodItems: MenuItemType[]
						stationMenus: StationMenuType[]
						corIcons: MasterCorIconMapType
					}
				}>()
			} catch (error) {
				seterror(error.message)
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

			setcorIcons(corIcons)
			setfoodItems(upgradedFoodItemsMap)
			setmeals([
				{
					label: 'Menu',
					stations: stationMenus,
					starttime: '0:00',
					endtime: '23:59',
				},
			])
			setnow(moment.tz(timezone()))
			setloading(false)
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
