// @flow

type CampusLocationsType = {
	display: string,
	buildingabbr: string,
	building: string,
	phone: string,
	room: number,
}

type DepartmentType = {
	href: string,
	name: string,
}

type HomeAddressType = {
	zip: string,
	city: string,
	country: string,
	state: string,
	street: Array<string>,
}

type DirectoryType = {
	displayName: string,
	classYear: number,
	suffixName: string,
	firstName: string,
	thumbnail: URL,
	departments: Array<DepartmentType>,
	email: string,
	homePhone: string,
	onLeave: boolean,
	homeAddress: HomeAddressType,
	lastName: string,
	profileUrl: string,
	username: string,
	campusLocations: Array<CampusLocationsType>,
	title: string,
	photo: string,
	officeHours: string,
	displayTitle: string,
}
