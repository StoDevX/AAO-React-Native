// @flow

type CampusLocation = {
	display: string,
	buildingabbr: string,
	building: string,
	phone: string,
	room: number,
}

type Department = {
	href: string,
	name: string,
}

type Address = {
	zip: string,
	city: string,
	country: string,
	state: string,
	street: Array<string>,
}

export type DirectoryItem = {
	campusLocations: Array<CampusLocation>,
	classYear: ?number,
	departments: Array<Department>,
	displayName: ?string,
	displayTitle: ?string,
	email: ?string,
	firstName: ?string,
	homeAddress: Address,
	homePhone: ?string,
	lastName: ?string,
	officeHours: ?string,
	onLeave: ?boolean,
	photo: string,
	profileUrl: ?string,
	suffixName: ?string,
	thumbnail: string,
	title: ?string,
	username: ?string,
}

export type SearchResults = {
	meta: {
		count: number,
		fullCount: number,
	},
	results: Array<DirectoryItem>,
}
