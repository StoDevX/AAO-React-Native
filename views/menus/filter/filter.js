// @flow
import React from 'react'
import {TableView} from 'react-native-tableview-simple'
import type {FilterSpecType} from './types'
import {SingleToggleSection} from './section-toggle'
import {ChecklistSection} from './section-checklist'

type PropsType = {
  sections: FilterSpecType[],
  onFilterChanged: (filter: FilterSpecType, val: any) => any,
};

export function FilterView({sections, onFilterChanged}: PropsType) {
  return (
    <TableView>
      {sections.map(filter => {
        if (filter.type === 'toggle') {
          return (
            <SingleToggleSection
              key={filter.key}
              header={filter.title}
              footer={filter.caption}
              onChange={newVal => onFilterChanged(filter, newVal)}
              value={filter.value}
              label={filter.label}
            />
          )
        } else if (filter.type === 'list') {
          if (filter.options && !filter.options.length) {
            return null
          }

          return (
            <ChecklistSection
              key={filter.key}
              header={filter.title}
              footer={filter.caption}
              onChange={newVal => onFilterChanged(filter, newVal)}
              value={filter.value}
              options={filter.options}
            />
          )
        }

        return null
      })}
    </TableView>
  )
}
