// @flow

export type JobType = {
	comments: string,
	contactEmail: string,
	contactName: string,
	contactPhone: string,
	description: string,
	goodForIncomingStudents: boolean,
	hoursPerWeek: string,
	howToApply: string,
	id: number,
	lastModified: string,
	links: Array<string>,
	office: string,
	openPositions: string,
	skills: string,
	timeline: string,
	timeOfHours: string | number,
	title: string,
	type: string,
	year: string,
}
