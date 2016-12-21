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
  if (filter.type === 'toggle') {
    return (
      <SingleToggleSection
        key={filter.key}
        header={filter.title}
        footer={filter.caption}
        onChange={newVal => onChange(filter, newVal)}
        value={filter.value}
        label={filter.label}
      />
    )
  }

  if (filter.type === 'list') {
    if (filter.options && !filter.options.length) {
      return null
    }

    return (
      <ChecklistSection
        key={filter.key}
        header={filter.title}
        footer={filter.caption}
        onChange={newVal => onChange(filter, newVal)}
        value={filter.value}
        options={filter.options}
      />
    )
  }

  return null
}
