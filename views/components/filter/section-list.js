// @flow
import React from 'react'
import type {ListType} from './types'
import {Section, Cell} from 'react-native-tableview-simple'
import includes from 'lodash/includes'
import without from 'lodash/without'
import concat from 'lodash/concat'

type PropsType = {
  filter: ListType,
  onChange: (filter: ListType) => any,
};

export function ListSection({filter, onChange}: PropsType) {
  const {spec} = filter
  const {title='', options, selected, mode} = spec
  const {caption=`Show items with ${mode === 'AND' ? 'all' : 'any'} of these options.`} = spec

  function buttonPushed(tappedValue: string) {
    let result

    if (includes(selected, tappedValue)) {
      // if the user has tapped an item, and it's already in the list of
      // things they've tapped, we want to _remove_ it from that list.
      result = without(selected, tappedValue)
    } else {
      // otherwise, we need to add it to the list
      result = concat(selected, tappedValue)
    }

    let enabled = false
    if (mode === 'OR') {
      enabled = result.length !== options.length
    } else if (mode === 'AND') {
      enabled = result.length > 0
    }

    onChange({
      ...filter,
      enabled: enabled,
      spec: {...spec, selected: result},
    })
  }

  function showAll() {
    let result

    if (selected.length === options.length) {
      // when all items are selected: uncheck them all
      result = []
    } else {
      // when one or more items are not checked: check them all
      result = options
    }

    onChange({
      ...filter,
      enabled: result.length !== options.length,
      spec: {...spec, selected: result},
    })
  }

  let buttons = options.map(val =>
    <Cell
      key={val}
      onPress={() => buttonPushed(val)}
      accessory={includes(selected, val) ? 'Checkmark' : null}
      title={val}
    />
  )

  if (mode === 'OR') {
    const showAllButton = (
      <Cell
        key='__show_all'
        title='Show All'
        onPress={showAll}
        accessory={selected.length === options.length ? 'Checkmark' : null}
      />
    )
    buttons = [showAllButton].concat(buttons)
  }

  return (
    <Section header={title.toUpperCase()} footer={caption}>
      {buttons}
    </Section>
  )
}
