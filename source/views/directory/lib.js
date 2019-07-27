// @flow

import type {OfficeHours, DirectoryItem} from './types'
import {entities} from '@frogpond/html-lib'

export const prefixTitle = (prefix: string) => {
	return prefix.endsWith(':') ? prefix.slice(0, -1) : prefix
}

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
