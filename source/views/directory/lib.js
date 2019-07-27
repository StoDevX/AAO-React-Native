// @flow

import type {OfficeHours, DirectoryItem} from './types'
import {entities} from '@frogpond/html-lib'


export const officeHoursTitle = (officeHours: OfficeHours) => {
	let content = officeHours.content || ''
	let label = officeHours.hrefLabel || ''

	return `${content} ${label}`
}

export const descriptionText = (shortRoom: string, item: DirectoryItem) => {
	let description =
		shortRoom && item.title
			? `${shortRoom} • ${item.title}`
			: shortRoom
			? shortRoom
			: item.title

	return description && entities.decode(description)
}

export const shortRoomText = (item: DirectoryItem) => {
	return item.campusLocations
		.map(loc => `${loc.buildingabbr} ${loc.room}`.trim())
		.join(' / ')
}
