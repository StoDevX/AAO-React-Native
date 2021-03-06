/* eslint-disable camelcase */
import type {MenuItemType} from '../../types'

import type {ItemCorIconMapType} from '@frogpond/food-menu/types'

export const item: (params: {
	cor_icon?: ItemCorIconMapType
	station?: string
	special?: boolean
}) => MenuItemType = ({
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
	nutrition_details: {},
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
