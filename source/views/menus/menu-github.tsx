import * as React from 'react'
import {useEffect, useState} from 'react'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
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
import groupBy from 'lodash/groupBy'
import {useFetch} from 'react-async'

type Props = {
	name: string
	loadingMessage: string[]
}

interface GithubMenuType {
	foodItems: MenuItemType[]
	stationMenus: StationMenuType[]
	corIcons: MasterCorIconMapType
}

function useGithubMenu() {
	return useFetch<{data: GithubMenuType}>(API('/food/named/menu/the-pause'), {
		headers: {accept: 'application/json'},
	})
}

export function GitHubHostedMenu(props: Props): JSX.Element {
	let [now, setNow] = useState(moment.tz(timezone()))
	let [foodItems, setFoodItems] = useState<MenuItemContainerType>({})
	let [corIcons, setCorIcons] = useState<MasterCorIconMapType>({})
	let [meals, setMeals] = useState<ProcessedMealType[]>([])

	let {data: {data} = {}, error, isLoading} = useGithubMenu()

	useEffect(() => {
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
	}, [data?.corIcons, data?.foodItems, data?.stationMenus])

	if (isLoading) {
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
			now={now}
		/>
	)
}
