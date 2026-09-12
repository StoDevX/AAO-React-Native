import {StyleProp, ViewStyle} from 'react-native'

import type {Gradient} from '@frogpond/colors'
import type {SFSymbol} from 'sf-symbols-typescript'

export type CampusLocation = {
	display: string
	buildingabbr: string
	building: string
	phone: string
	room: number
	shortLocation: string
}

export type Department = {
	href: string
	name: string
}

type Address = {
	zip: string
	city: string
	country: string
	state: string
	street: Array<string>
}

export type OfficeHours = {
	display: string
	prefix: string
	hrefLabel: string | null
	href: string | null
	content: string
	// added from ccc-server
	description: string
	title: string
}

type OnLeave = {
	start: string
	end: string
	type: string
}

export type DirectoryItem = {
	campusLocations: Array<CampusLocation>
	classYear: string | null
	departments: Array<Department>
	displayName: string
	displayTitle: string | null
	email: string | null
	firstName: string
	homeAddress: Address
	homePhone: string | null
	lastName: string
	officeHours: OfficeHours | null
	onLeave: OnLeave | null
	/**
	 * The full-size portrait, 1337x2003 and 205 KB. Nothing reads it: both
	 * screens draw `thumbnail`, which is the same picture at a size they can
	 * use. Kept for a full-screen photo view.
	 */
	photo: string
	profileUrl: string | null
	pronouns: Array<string> | null
	suffixName: string | null
	thumbnail: string
	title: string | null
	username: string | null
	// added from ccc-server
	description: string | null
}

export type SearchResults = {
	meta: {
		count: number
		fullCount: number
	}
	results: Array<DirectoryItem>
}

export type DirectorySearchTypeEnum =
	| 'department'
	| 'firstName'
	| 'lastName'
	| 'major'
	| 'query'
	| 'title'
	| 'username'

export type DirectoryIconName =
	| 'calendar-clock-outline'
	| 'email-outline'
	| 'handshake-outline'
	| 'link'
	| 'map-marker-outline'
	| 'open-in-new'
	| 'phone'

export interface DirectoryIconProps {
	color: string
	style?: StyleProp<ViewStyle>
}

/** A curated campus contact, from `data/contact-info/*.yaml`. */
export type ContactType = {
	title: string
	phoneNumber?: string
	buttonText: string
	buttonLink?: string
	/**
	 * Required by the schema; read by nothing here. Its consumer was the list
	 * screen and row this feature replaced. `synopsis` below is retained for
	 * the same reason -- dropping either means a data deploy, not a code one.
	 */
	category: string
	image?: string
	text: string
	/** See the note on `category` above. */
	synopsis: string
	/**
	 * The tile's SF Symbol. Optional in TypeScript though the schema requires
	 * it: a released app can meet data deployed before this field existed.
	 */
	icon?: SFSymbol
	/** A name from `GRADIENT_NAMES`, or an explicit `[inner, outer]` pair. */
	gradient?: string | Gradient
}

/**
 * One row from `directory/departments` -- the campus department roster.
 *
 * The directory returns whatever it deployed; consumers treat this as an
 * assertion, not a check. Only `name` is used in the app today.
 */
export type DepartmentListing = {
	name: string
	buildingabbr: string | null
	buildingname: string | null
	buildingroom: string | null
	email: string | null
	extension: number | null
	fax: string | null
	headcount: number
	text: string | null
	website: string | null
}
