// @flow
import React from 'react'
import type {FilterSpecType} from './types'
import {SingleToggleSection} from './section-toggle'
import {ChecklistSection} from './section-checklist'

type FilterSectionPropsType = {
  filter: FilterSpecType,
  onChange: (filter: FilterSpecType, val: any) => any,
};

export function FilterSection({filter, onChange}: FilterSectionPropsType) {
  let callback = val => onChange(filter, val)

  if (filter.type === 'toggle') {
    return <SingleToggleSection filter={filter} onChange={callback} />
  }

  if (filter.type === 'list') {
    if (filter.options && !filter.options.length) {
      return null
    }

    return <ChecklistSection filter={filter} onChange={callback} />
  }

  return null
}
