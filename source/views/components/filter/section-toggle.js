// @flow
import * as React from 'react'
import type {ToggleType} from './types'
import {Section} from 'react-native-tableview-simple'
import {CellToggle} from '../../components/cells/toggle'

type PropsType = {
  filter: ToggleType,
  onChange: (filterSpec: ToggleType) => any,
}

export function SingleToggleSection({filter, onChange}: PropsType) {
  const {spec, enabled} = filter
  const {title = '', caption, label} = spec
  return (
    <Section footer={caption} header={title.toUpperCase()}>
      <CellToggle
        label={label}
        onChange={val => onChange({...filter, enabled: val})}
        value={enabled}
      />
    </Section>
  )
}
