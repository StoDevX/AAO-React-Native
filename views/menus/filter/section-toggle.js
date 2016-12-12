// @flow
import React from 'react'
import {Text, Switch} from 'react-native'

import {Section, CustomCell} from 'react-native-tableview-simple'

type PropsType = {
  header?: string,
  footer?: string,
  label: string,
  value: bool,
  onChange: () => any,
};

export function SingleToggleSection({header, footer, label, value, onChange}: PropsType) {
  return (
    <Section header={header} footer={footer}>
      <CustomCell>
        <Text style={{flex: 1, fontSize: 16}}>{label}</Text>
        <Switch value={value} onValueChange={onChange} />
      </CustomCell>
    </Section>
  )
}
