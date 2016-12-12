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
      {sections.map(info =>
        info.type === 'toggle'
          ? <SingleToggleSection
            key={info.key}
            header={info.title}
            footer={info.caption}
            label={info.label}
            value={info.value}
            onChange={newVal => onFilterChanged(info, newVal)}
          />
          : <ChecklistSection
            key={info.key}
            header={info.title}
            footer={info.caption}
            options={info.options}
            value={info.value}
            onChange={newVal => onFilterChanged(info, newVal)}
          />
      )}
    </TableView>
  )
}
