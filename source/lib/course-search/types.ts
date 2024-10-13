interface CourseOffering {
	day: string
	end: string
	location: string
	start: string
}

export interface RawCourseType {
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
	offerings: CourseOffering[]
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

export interface CourseType {
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
	offerings: CourseOffering[]
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

export interface TermType {
	hash: string
	path: string
	term: number
	type: string
	year: number
}

export interface TermInfoType {
	files: TermType[]
	type: string
}
