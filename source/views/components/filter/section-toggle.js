// @flow
import React from 'react'
import type {ToggleType} from './types'
import {Text, Switch} from 'react-native'
import {Section, CustomCell} from 'react-native-tableview-simple'

type PropsType = {
  filter: ToggleType,
  onChange: (filterSpec: ToggleType) => any,
};

export function SingleToggleSection({filter, onChange}: PropsType) {
  const {spec, enabled} = filter
  const {title='', caption, label} = spec
  return (
    <Section header={title.toUpperCase()} footer={caption}>
      <CustomCell>
        <Text style={{flex: 1, fontSize: 16}}>{label}</Text>
        <Switch value={enabled} onValueChange={val => onChange({...filter, enabled: val})} />
      </CustomCell>
    </Section>
  )
}
