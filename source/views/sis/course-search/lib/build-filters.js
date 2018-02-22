// @flow

import {getTermInfo} from '../../../../lib/storage'
import {parseTerm} from '../../../../lib/course-search/parse-term'

export async function buildFilters(): FilterType[] {

  const terms = await getTermInfo()
  // const termLabels = terms.map(term => parseTerm(term.term.toString()))
  // const allTerms = termLabels.map(label => ({title: label}))
  const allTerms = terms.map(term => (
    {title: term.term, label: parseTerm(term.term.toString())}
  ))
  console.log(allTerms)

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
