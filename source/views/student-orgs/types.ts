export interface ContactPersonType {
	lastName: string
	title: string
	firstName: string
	email: string
}

export interface AdvisorType {
	email: string
	name: string
}

export interface StudentOrgType {
	meetings: string
	contacts: ContactPersonType[]
	advisors: AdvisorType[]
	description: string
	category: string
	lastUpdated: string
	website: string
	name: string
}
