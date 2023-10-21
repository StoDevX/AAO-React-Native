import {client} from '@frogpond/api'
import {toLaxTitleCase as titleCase} from '@frogpond/titlecase'

import {JobType} from './types'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {groupBy, orderBy} from 'lodash'

export const keys = {
	all: ['student-work'] as const,
}

// Turns out that, for our data, we really just want to sort the categories
// _backwards_ - that is, On-Campus Work Study should come before
// Off-Campus Work Study, and the Work Studies should come before the
// Summer Employments
let sorters: Array<(job: JobType) => string> = [
	(j) => j.type, // sort any groups with the same sort index alphabetically
	(j) => j.office, // sort all jobs with the same office
	(j) => j.lastModified, // sort all jobs by date-last-modified
]

let ordered: Array<'desc' | 'asc'> = ['desc', 'asc', 'desc']

export function useStudentWorkPostings(): UseQueryResult<
	{title: string; data: JobType[]}[],
	unknown
> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = (await client.get('jobs', {signal}).json()) as JobType[]

			// force title-case on the job types, to prevent not-actually-duplicate headings
			return response.map((job) => ({
				...job,
				type: titleCase(job.type),
			})) as JobType[]
		},
		select: (data) => {
			let sorted = orderBy(data, sorters, ordered)
			let grouped = groupBy(sorted, (j) => j.type)
			return Object.entries(grouped).map(([title, data]) => ({title, data}))
		},
	})
}
