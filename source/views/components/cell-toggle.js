// @flow
import React from 'react'
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
      title={label}
      cellAccessoryView={<Switch value={value} onValueChange={onChange} />}
    />
  )
}
