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
	photo: string
	profileUrl: string | null
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

export type DirectorySearchTypeEnum = 'Query' | 'Department'
