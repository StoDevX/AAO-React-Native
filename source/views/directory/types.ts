export type CampusLocation = {
	display: string
	buildingabbr: string
	building: string
	phone: string
	room: number
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
	hrefLabel: string
	href: string
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
	classYear: ?number
	departments: Array<Department>
	displayName: ?string
	displayTitle: ?string
	email: ?string
	firstName: ?string
	homeAddress: Address
	homePhone: ?string
	lastName: ?string
	officeHours: ?OfficeHours
	onLeave: ?OnLeave
	photo: string
	profileUrl: ?string
	suffixName: ?string
	thumbnail: string
	title: ?string
	username: ?string
	// added from ccc-server
	description: string
}

export type SearchResults = {
	meta: {
		count: number
		fullCount: number
	}
	results: Array<DirectoryItem>
}
