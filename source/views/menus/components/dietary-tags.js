// @flow
import * as React from 'react'
import {View, StyleSheet, Image} from 'react-native'

import keys from 'lodash/keys'
import pick from 'lodash/pick'
import map from 'lodash/map'
import type {ItemCorIconMapType, MasterCorIconMapType} from '../types'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  icons: {
    marginHorizontal: 3,
    width: 15,
    height: 15,
  },
})

export function DietaryTags({
  corIcons,
  dietary,
  style,
}: {
  corIcons: MasterCorIconMapType,
  dietary: ItemCorIconMapType,
  style?: any,
}) {
  // filter the mapping of all icons by just the icons provided by this item
  let filtered = Array.isArray(dietary)
    ? pick(corIcons, [])
    : pick(corIcons, keys(dietary))

  // turn the remaining items into images
  let tags = map(filtered, (dietaryIcon, key) => (
    <Image key={key} source={{uri: dietaryIcon.image}} style={styles.icons} />
  ))

  return <View style={[styles.container, style]}>{tags}</View>
}
