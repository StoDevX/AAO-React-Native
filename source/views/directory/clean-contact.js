// @flow
import type {DirectoryType} from './types'

export default function cleanContact(contact: DirectoryType): DirectoryType {
	const name = contact.displayName
	const title = contact.displayTitle
	const photo = contact.thumbnail
	const building = contact.building
	const room = contact.room ? contact.room : ''
	const office = building || room ? `${building} ${room}` : ''
	const officeHours = contact.officeHours
	const departments = contact.departments
	const phone = contact.officePhone
	const email = contact.email

	let profile = contact.profileUrl
	if (profile && !/^https?:\/\//u.test(profile)) {
		profile = `http://${profile}`
	}

	return {
		...contact,
		name,
		title,
		photo,
		office,
		officeHours,
		departments,
		phone,
		profile,
		email,
	}
}
