// @flow

import {getTermInfo} from '../../../../lib/storage'
import {parseTerm} from '../../../../lib/course-search/parse-term'
import type {FilterType} from '../../../components/filter'

export async function buildFilters(): Promise<FilterType[]> {
	const terms = await getTermInfo()
	const allTerms = terms.map(term => ({
		title: term.term,
		label: parseTerm(term.term.toString()),
	}))

	return [
		{
			type: 'list',
			key: 'term',
			enabled: false,
			spec: {
				title: 'Terms',
				options: allTerms,
				mode: 'OR',
				selected: allTerms,
				displayTitle: false,
			},
			apply: {
				key: 'term',
			},
		},
	]
}
