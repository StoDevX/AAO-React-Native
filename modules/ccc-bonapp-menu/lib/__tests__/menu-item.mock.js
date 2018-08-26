/* eslint-disable camelcase */
// @flow
import type {MenuItemType} from '../../types'

export const item: ({|
	cor_icon?: Object,
	station?: string,
	special?: boolean,
|}) => MenuItemType = ({
	cor_icon: corIcon = {},
	station = '',
	special = false,
}) => ({
	connector: '',
	cor_icon: corIcon,
	id: '',
	description: '',
	label: '',
	monotony: {},
	nutrition_link: '',
	nutrition: {},
	options: [],
	rating: '',
	special: special,
	station: station,
	sub_station: '',
	sub_station_order: '',
	sub_station_id: '',
	price: '',
	tier3: false,
	zero_entree: '',
})
