import {StyleProp, ViewStyle} from 'react-native'

export interface CampusLocation {
	display: string
	buildingabbr: string
	building: string
	phone: string
	room: number
	shortLocation: string
}

export interface Department {
	href: string
	name: string
}

interface Address {
	zip: string
	city: string
	country: string
	state: string
	street: string[]
}

export interface OfficeHours {
	display: string
	prefix: string
	hrefLabel: string | null
	href: string | null
	content: string
	// added from ccc-server
	description: string
	title: string
}

interface OnLeave {
	start: string
	end: string
	type: string
}

export interface DirectoryItem {
	campusLocations: CampusLocation[]
	classYear: string | null
	departments: Department[]
	displayName: string
	displayTitle: string | null
	email: string | null
	firstName: string
	homeAddress: Address
	homePhone: string | null
	lastName: string
	officeHours: OfficeHours | null
	onLeave: OnLeave | null
	photo: string
	profileUrl: string | null
	pronouns: string[] | null
	suffixName: string | null
	thumbnail: string
	title: string | null
	username: string | null
	// added from ccc-server
	description: string | null
}

export interface SearchResults {
	meta: {
		count: number
		fullCount: number
	}
	results: DirectoryItem[]
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
