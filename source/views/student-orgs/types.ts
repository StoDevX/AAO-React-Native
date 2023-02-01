export type ContactPersonType = {
	lastName: string
	title: string
	firstName: string
	email: string
}

export type AdvisorType = {
	email: string
	name: string
}

export interface RawStudentOrgType {
	meetings: string
	contacts: ContactPersonType[]
	advisors: AdvisorType[]
	description: string
	category: string
	lastUpdated: string
	website: string
	name: string
}

export interface StudentOrgType extends RawStudentOrgType {
	key: string
}
