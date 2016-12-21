// @flow
import React from 'react'
import type {SelectSpecType} from './types'
import {Section, Cell} from 'react-native-tableview-simple'
import includes from 'lodash/includes'
import without from 'lodash/without'
import concat from 'lodash/concat'

type PropsType = {
  filter: SelectSpecType,
  onChange: () => any,
};

export function ChecklistSection({filter: {title, caption, options, value}, onChange}: PropsType) {
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
    <Section header={title} footer={caption}>
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
