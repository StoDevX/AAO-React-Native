// @flow
import React from 'react'
import type {ToggleSpecType} from './types'
import {Text, Switch} from 'react-native'
import {Section, CustomCell} from 'react-native-tableview-simple'

type PropsType = {
  filter: ToggleSpecType,
  onChange: (filter: ToggleSpecType) => any,
};

export function SingleToggleSection({filter, onChange}: PropsType) {
  const {title='', caption, label, value} = filter
  return (
    <Section header={title.toUpperCase()} footer={caption}>
      <CustomCell>
        <Text style={{flex: 1, fontSize: 16}}>{label}</Text>
        <Switch value={value} onValueChange={val => onChange({...filter, value: val})} />
      </CustomCell>
    </Section>
  )
}
