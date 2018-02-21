// @flow

import {getTermInfo} from '../../../../lib/storage'
import {parseTerm} from '../../../../lib/course-search/parse-term'

export async function buildFilters(): FilterType[] {

  const terms = await getTermInfo()
  const termLabels = terms.map(term => parseTerm(term.term.toString()))
  const allTerms = termLabels.map(label => ({title: label}))
  console.log(allTerms)

  return [
    {
      type: 'list',
			key: 'terms',
			enabled: false,
			spec: {
				title: 'Terms',
				options: allTerms,
				mode: 'OR',
				selected: allTerms,
			},
			apply: {
				key: 'terms',
			},
    },
  ]
}
