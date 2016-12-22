// @flow
import React from 'react'
import type {FilterSpecType} from './types'
import {SingleToggleSection} from './section-toggle'
import {ListSection} from './section-list'

type FilterSectionPropsType = {
  filter: FilterSpecType,
  onChange: (filter: FilterSpecType) => any,
};

export function FilterSection({filter, onChange}: FilterSectionPropsType) {
  if (filter.type === 'toggle') {
    return <SingleToggleSection filter={filter} onChange={onChange} />
  }

  if (filter.type === 'list') {
    if (filter.options && !filter.options.length) {
      return null
    }

    return <ListSection filter={filter} onChange={onChange} />
  }

  return null
}
