// @flow

export type CourseType = {
	clbid: number,
	credits: number,
	crsid: number,
	departments: string[],
	description?: string[],
	enroll: number,
	gereqs?: string[],
	instructors: string[],
	level: number,
	locations?: string[],
	max: number,
	name: string,
	notes?: string[],
	number: number,
	open: boolean,
	pn: boolean,
	prerequisites: false | string,
	section?: string,
	semester: number,
	status: string,
	term: number,
	times?: string[],
	title?: string,
	type: string,
	year: number,
}

export type TermType = {
	hash: string,
	path: string,
	term: number,
	type: string,
	year: number,
}
