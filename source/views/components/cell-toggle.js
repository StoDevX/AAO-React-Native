// @flow
import React from 'react'
import {Text, Switch} from 'react-native'
import {Cell} from 'react-native-tableview-simple'

type PropsType = {
  label: string,
  value: boolean,
  onChange: (val: boolean) => any,
}

export function CellToggle({value, onChange, label}: PropsType) {
  return (
    <Cell
      cellContentView={<Text style={{flex: 1, fontSize: 16}}>{label}</Text>}
      cellAccessoryView={<Switch value={value} onValueChange={onChange} />}
    />
  )
}
