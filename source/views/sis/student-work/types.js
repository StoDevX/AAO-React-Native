// @flow

export type JobType = {
	id: number,
	comments: string,
	contactEmail: string,
	contactFirstName: string,
	contactLastName: string,
	contactName: string,
	contactPhone: number,
	description: string,
	hoursPerWeek: string,
	lastModified: string,
	links: Array<string>,
	office: string,
	skills: string,
	timeOfHours: string | number,
	title: string,
	type: string,
}
