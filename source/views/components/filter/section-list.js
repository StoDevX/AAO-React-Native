// @flow
import * as React from 'react'
import {Text, Image, StyleSheet} from 'react-native'
import type {ListType, ListItemSpecType} from './types'
import {Section, Cell} from 'react-native-tableview-simple'
import {Column} from '../layout'
import includes from 'lodash/includes'
import without from 'lodash/without'
import concat from 'lodash/concat'

type PropsType = {
  filter: ListType,
  onChange: (filter: ListType) => any,
}

export function ListSection({filter, onChange}: PropsType) {
  const {spec} = filter
  const {title = '', options, selected, mode} = spec
  const quantifier = mode === 'AND' ? 'all' : 'any'
  const {caption = `Show items with ${quantifier} of these options.`} = spec

  function buttonPushed(tappedValue: ListItemSpecType) {
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

  const hasImageColumn = options.some(val => Boolean(val.image))
  let buttons = options.map(val => (
    <Cell
      key={val.title}
      accessory={includes(selected, val) ? 'Checkmark' : undefined}
      cellContentView={
        <Column style={styles.content}>
          <Text style={styles.title}>{val.title}</Text>
          {val.detail ? <Text style={styles.detail}>{val.detail}</Text> : null}
        </Column>
      }
      cellStyle="RightDetail"
      disableImageResize={true}
      image={
        spec.showImages ? (
          <Image source={val.image} style={styles.icon} />
        ) : (
          undefined
        )
      }
      onPress={() => buttonPushed(val)}
    />
  ))

  if (mode === 'OR') {
    const showAllButton = (
      <Cell
        key="__show_all"
        accessory={selected.length === options.length ? 'Checkmark' : undefined}
        onPress={showAll}
        title="Show All"
      />
    )
    buttons = [showAllButton].concat(buttons)
  }

  return (
    <Section
      footer={caption}
      header={title.toUpperCase()}
      separatorInsetLeft={hasImageColumn ? 45 : undefined}
    >
      {buttons}
    </Section>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingVertical: 10,
  },
  title: {
    fontSize: 16,
  },
  detail: {
    fontSize: 11,
  },
  icon: {
    width: 16,
    height: 16,
  },
})
