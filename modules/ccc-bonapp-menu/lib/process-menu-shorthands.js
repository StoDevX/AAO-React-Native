/* eslint-disable camelcase */
// @flow
import type {MenuItemType, StationMenuType} from '../types'

type BasicMenuItemType = {
	label: string,
	station: string,
	special: boolean,
	description: string,
}

type BasicStationMenuType = {
	label: string,
}

export function upgradeMenuItem(
	item: BasicMenuItemType,
	index: number,
): MenuItemType {
	return {
		connector: '',
		cor_icon: {},
		description: '',
		options: [],
		ordered_cor_icon: {},
		monotony: {},
		nutrition: {
			kcal: '',
			well_being: '',
			well_being_image: '',
		},
		nutrition_link: '',
		price: '',
		rating: '',
		special: false,
		sub_station: '',
		sub_station_id: '',
		sub_station_order: '',
		tier3: false,
		zero_entree: '0',
		...item,
		id: String(index),
	}
}

export function upgradeStation(
	station: BasicStationMenuType,
	index: number,
): StationMenuType {
	return {
		soup: false,
		price: '',
		note: '',
		order_id: String(index),
		items: [],
		...station,
		id: String(index),
	}
}
