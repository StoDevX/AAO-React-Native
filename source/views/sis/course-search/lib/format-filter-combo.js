// @flow
import {type FilterType} from '../../../components/filter/types'
import {filterListSpecs} from '../../../components/filter'
import {formatTerms} from './format-terms'

export type FilterComboType = {
	filters: FilterType[],
	description: string,
}

export function formatFilterCombo(filters: FilterType[]): FilterComboType {
  const filterCombo = filters.filter(f => f.enabled)
  const comboDescription = filterCombo
    .map(f => {
      switch (f.key) {
        case 'status': {
          return 'Open Courses'
        }
        case 'type': {
          return 'Labs Only'
        }
        case 'term': {
          const termFilter = filterListSpecs(filters).find(
            f => f.key === 'term',
          )
          const selectedTerms = termFilter ? termFilter.spec.selected : []
          const terms = selectedTerms.map(t => parseInt(t.title))
          return formatTerms(terms)
        }
        case 'gereqs': {
          const geFilter = filterListSpecs(filters).find(
            f => f.key === 'gereqs',
          )
          const selectedGEs = geFilter ? geFilter.spec.selected : []
          return selectedGEs.map(ge => ge.title).join('/')
        }
        case 'departments': {
          const deptFilter = filterListSpecs(filters).find(
            f => f.key === 'departments',
          )
          const selectedDepts = deptFilter ? deptFilter.spec.selected : []
          return selectedDepts.map(dept => dept.title).join('/')
        }
        default:
          return ''
      }
    })
    .join(', ')
    return {filters: filterCombo, description: comboDescription}
}
