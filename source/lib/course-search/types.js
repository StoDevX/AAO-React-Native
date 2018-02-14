// @flow

export type CourseType = {
	clbid: number,
	credits: number,
	crsid: number,
	departments: string[],
	description?: string[],
	gereqs?: string[],
	instructors: string[],
	level: number,
	locations?: string[],
	name: string,
	notes?: string[],
	number: number,
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
