// @flow
import type {DirectoryType, LocationType} from './types'

export default function cleanContact(contact: DirectoryType): DirectoryType {
	const name = contact.displayName
	const title = contact.displayTitle
	const photo = contact.thumbnail
	const officeHours = contact.officeHours
	const departments = contact.departments
	const phone = contact.officePhone
	const email = contact.email

	let locations = contact.campusLocations.map(location => ({
		display: location.display,
		phone: location.phone,
	}))

	let profile = contact.profileUrl
	if (profile && !/^https?:\/\//u.test(profile)) {
		profile = `http://${profile}`
	}

	return {
		...contact,
		name,
		title,
		photo,
		locations,
		officeHours,
		departments,
		phone,
		profile,
		email,
	}
}
