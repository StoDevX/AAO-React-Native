// @flow

export type CourseType = {
	clbid: number,
	credits: number,
	crsid: number,
	departments: string[],
	instructors: string[],
	level: number,
	name: string,
	pn: boolean,
	prerequisites: boolean,
	semester: number,
	status: string,
	term: number,
	type: string,
	year: number,
	description?: string[],
	gereqs?: string[],
	locations?: string[],
	notes?: string[],
	section?: string,
	times?: string[],
}

export type TermType = {
	hash: string,
	path: string,
	term: number,
	type: string,
	year: number,
}
