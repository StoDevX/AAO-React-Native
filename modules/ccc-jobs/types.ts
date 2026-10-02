export interface JobSummary {
	id: string
	title: string
	postedDate: string
	location: string | undefined
}

export interface JobCategory {
	id: number
	name: string
	count: number
	jobs: JobSummary[]
}

export interface JobField {
	label: string
	value: string
}

export interface JobDetail {
	id: string
	title: string
	category: string | undefined
	schedule: string | undefined
	location: string | undefined
	postedDate: string | undefined
	fields: JobField[]
	/// The St. Olaf unit the posting's description names, as five digits, or
	/// null when it names none. Never shown; Student Work sorts by it.
	unit: string | null
	/// Markdown, for `@frogpond/markdown`.
	body: string
	url: string
}
