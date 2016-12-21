// @flow
import React from 'react'
import {Section, Cell} from 'react-native-tableview-simple'
import includes from 'lodash/includes'
import without from 'lodash/without'
import concat from 'lodash/concat'

type PropsType = {
  header?: string,
  footer?: string,
  options: string[],
  onChange: () => any,
  value: string[],
};

export function ChecklistSection({header, footer, options, onChange, value}: PropsType) {
  function callback(tappedValue) {
    let result = value

    // we default to all items selected
    if (includes(value, tappedValue)) {
      // therefore, if the user has tapped an item, and it's already in the
      // list of things they've tapped, we want to _remove_ it from that list.
      result = without(value, tappedValue)
    } else {
      // otherwise, we need to add it to the list
      result = concat(value, tappedValue)
    }

    onChange(result)
  }

  return (
    <Section header={header} footer={footer}>
      {options.map(val =>
        <Cell
          key={val}
          onPress={() => callback(val)}
          accessory={includes(value, val) ? null : 'Checkmark'}
          title={val}
        />)}
    </Section>
  )
}
