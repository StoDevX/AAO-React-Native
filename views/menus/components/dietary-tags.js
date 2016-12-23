// @flow
import React from 'react'
import {View, StyleSheet, Image} from 'react-native'

import keys from 'lodash/keys'
import pick from 'lodash/pick'
import map from 'lodash/map'
import type {ItemCorIconMapType, MasterCorIconMapType} from '../types'

const styles = StyleSheet.create({
  icons: {
    marginLeft: 7,
    width: 15,
    height: 15,
  },
})

export function DietaryTags({filters, dietary, style}: {filters: MasterCorIconMapType, dietary: ItemCorIconMapType, style?: any}) {
  // filter the mapping of all icons by just the icons provided by this item
  let filtered = pick(filters, keys(dietary))

  // turn the remaining items into images
  let tags = map(filtered, (dietaryIcon, key) =>
    <Image
      key={key}
      source={dietaryIcon.icon}
      style={styles.icons}
    />)

  return <View style={style}>{tags}</View>
}
