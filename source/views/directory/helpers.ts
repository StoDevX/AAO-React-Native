import {ComponentProps} from 'react'
import {callPhone} from '../../components/call-phone'
import {sendEmail} from '../../components/send-email'
import {decode} from '@frogpond/html-lib'
import {FAB} from 'react-native-paper'

// We can pull unexported props out with the built-in type utility from react
// and flatten the array into just the object underneath
type Flatten<Type> = Type extends (infer Item)[] ? Item : Type
type RNPaperFABGroupAction = Flatten<
	ComponentProps<(typeof FAB)['Group']>['actions']
>

import type {
	CampusLocation,
	DirectoryItem,
	OfficeHours,
	SearchResults,
} from './types'

export const buildPhoneActions = (
	loc: CampusLocation,
	locationsCount: number,
): RNPaperFABGroupAction => {
	return {
		icon: 'phone',
		label:
			locationsCount === 1 ? 'Call' : `Call ${loc.buildingabbr} ${loc.room}`,
		onPress: () => { callPhone(loc.phone); },
	}
}

export const buildEmailAction = (
	email: DirectoryItem['email'],
): RNPaperFABGroupAction[] => {
	if (!email) return []

	return [
		{
			icon: 'email',
			label: 'Email',
			onPress: () => { sendEmail({to: [email], subject: '', body: ''}); },
		},
	]
}

const prefixTitle = (prefix: OfficeHours['prefix']): string => {
	return prefix.endsWith(':') ? prefix.slice(0, -1) : prefix
}

const officeHoursTitle = (officeHours: OfficeHours): string => {
	const content = officeHours.content || ''
	const label = officeHours.hrefLabel || ''

	return `${content} ${label}`
}

const descriptionText = (
	shortRoom: CampusLocation['shortLocation'],
	item: DirectoryItem,
): string | null => {
	const description =
		shortRoom && item.title
			? `${shortRoom} • ${item.title}`
			: shortRoom
			  ? shortRoom
			  : item.title

	return description && decode(description)
}

const shortRoomText = (
	campusLocations: DirectoryItem['campusLocations'],
): string => {
	return campusLocations
		.map((loc) => `${loc.buildingabbr} ${loc.room}`.trim())
		.join(' / ')
}

const shortRoomDetail = (loc: CampusLocation): string => {
	const shortRoom = `${loc.buildingabbr} ${loc.room}`.trim()
	return `${shortRoom ? `${shortRoom} • ` : ''}${loc.phone}`
}

export const formatResults = (
	results: SearchResults['results'],
): SearchResults['results'] => {
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
