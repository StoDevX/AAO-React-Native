// @flow

export type DirectoryType = {
	displayName: string,
	classYear: number,
	suffixName: string,
	extension: number,
	firstName: string,
	thumbnail: URL,
	departments: Array<DepartmentType>,
	email: string,
	homePhone: null,
	onLeave: boolean,
	officePhone: string,
	homeAddress: {
		zip: string,
		city: string,
		country: string,
		state: string,
		street: Array<string>,
	},
	building: string,
	lastName: string,
	profileUrl: string,
	username: string,
	title: string,
	photo: string,
	officeHours: string,
	room: number,
	displayTitle: string,
}

export type DepartmentType = {
	href: string,
	name: string,
}
