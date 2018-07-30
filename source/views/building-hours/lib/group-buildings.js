// @flow

import type {BuildingType} from '../types'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'

import QuickLRU from 'quick-lru'
import mem from 'mem'

function groupBuildings(buildings: BuildingType[], favorites: string[]) {
	const favoritesGroup = {
		title: 'Favorites',
		data: buildings.filter(b => favorites.includes(b.name)),
	}

	const grouped = groupBy(buildings, b => b.category || 'Other')
	let groupedBuildings = toPairs(grouped).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	if (favoritesGroup.data.length > 0) {
		groupedBuildings = [favoritesGroup, ...groupedBuildings]
	}

	return groupedBuildings
}

let memGroupBuildings = mem(groupBuildings, {cache: new QuickLRU({maxSize: 1})})

export {groupBuildings, memGroupBuildings}
