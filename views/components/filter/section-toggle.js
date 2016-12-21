// @flow
import React from 'react'
import type {ToggleSpecType} from './types'
import {Text, Switch} from 'react-native'
import {Section, CustomCell} from 'react-native-tableview-simple'

type PropsType = {
  filter: ToggleSpecType,
  onChange: () => any,
};

export function SingleToggleSection({filter: {title, caption, label, value}, onChange}: PropsType) {
  return (
    <Section header={title} footer={caption}>
      <CustomCell>
        <Text style={{flex: 1, fontSize: 16}}>{label}</Text>
        <Switch value={value} onValueChange={onChange} />
      </CustomCell>
    </Section>
  )
}
