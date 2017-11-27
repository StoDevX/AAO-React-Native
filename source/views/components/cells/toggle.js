// @flow
import * as React from 'react'
import {Switch} from 'react-native'
import {Cell} from 'react-native-tableview-simple'

type PropsType = {
  label: string,
  value: boolean,
  onChange: (val: boolean) => any,
}

export function CellToggle({value, onChange, label}: PropsType) {
  return (
    <Cell
      cellAccessoryView={<Switch onValueChange={onChange} value={value} />}
      title={label}
    />
  )
}
