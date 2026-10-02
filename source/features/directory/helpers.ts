import {decode} from '@frogpond/html-lib'
import type {CampusLocation, DirectoryItem, OfficeHours, SearchResults} from './types'

const prefixTitle = (prefix: OfficeHours['prefix']): string => {
	return prefix.endsWith(':') ? prefix.slice(0, -1) : prefix
}

const officeHoursTitle = (officeHours: OfficeHours): string => {
	return [officeHours.content, officeHours.hrefLabel].filter(Boolean).join(' ')
}

const descriptionText = (
	shortRoom: CampusLocation['shortLocation'],
	item: DirectoryItem,
): string | null => {
	const description =
		shortRoom && item.title ? `${shortRoom} • ${item.title}` : shortRoom ? shortRoom : item.title

	return description && decode(description)
}

const shortRoomText = (campusLocations: DirectoryItem['campusLocations']): string => {
	return campusLocations.map((loc) => `${loc.buildingabbr} ${loc.room}`.trim()).join(' / ')
}

const shortRoomDetail = (loc: CampusLocation): string => {
	const shortRoom = `${loc.buildingabbr} ${loc.room}`.trim()
	return `${shortRoom ? `${shortRoom} • ` : ''}${loc.phone}`
}

export const formatResults = (results: SearchResults['results']): SearchResults['results'] => {
	return results.map((item: DirectoryItem) => {
		const {campusLocations, displayTitle, officeHours} = item
		const shortRoom = shortRoomText(campusLocations)

		const result = {
			...item,
			description: descriptionText(shortRoom, item),
			displayTitle: displayTitle && decode(displayTitle),
		}

		if (officeHours) {
			result.officeHours = {
				...officeHours,
				description: officeHoursTitle(officeHours),
				title: prefixTitle(officeHours.prefix),
			}
		}

		if (campusLocations) {
			const locations = campusLocations.map((loc: CampusLocation) => ({
				...loc,
				shortLocation: shortRoomDetail(loc),
			}))

			result.campusLocations = locations
		}

		return result
	})
}
