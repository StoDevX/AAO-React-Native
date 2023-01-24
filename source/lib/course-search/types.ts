type CourseOffering = {
	day: string
	end: string
	location: string
	start: string
}

export type RawCourseType = {
	clbid: number
	credits: number
	crsid: number
	department: string
	description?: string[]
	enrolled: number
	gereqs?: string[]
	instructors: string[]
	level: number
	max: number
	name: string
	notes?: string[]
	number: number
	offerings: Array<CourseOffering>
	pn: boolean
	prerequisites: false | string
	section?: string
	semester: number
	status: string
	term: number
	title?: string
	type: string
	year: number
}

export type CourseType = {
	clbid: number
	credits: number
	crsid: number
	department: string
	description?: string[]
	enrolled: number
	gereqs?: string[]
	instructors: string[]
	level: number
	max: number
	name: string
	notes?: string[]
	number: number
	offerings: Array<CourseOffering>
	spaceAvailable: boolean
	pn: boolean
	prerequisites: false | string
	section?: string
	semester: number
	status: string
	term: number
	title?: string
	type: string
	year: number
}

export type TermType = {
	hash: string
	path: string
	term: number
	type: string
	year: number
}

export type TermInfoType = {
	files: Array<TermType>
	type: string
}
