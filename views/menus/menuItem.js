/**
 * All About Olaf
 * A list of the items availiable from a single menuSection
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

let styles = StyleSheet.create({
  container: {
  },
  menuItem: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: 4,
  },
  name: {
    flex: 1,
    textAlign: 'left',
  },
  price: {
    textAlign: 'right',
  },
})

import type {MenuItemType} from './types'

export default function MenuItem({items, style}: {items: MenuItemType[], style: number|Object}) {
  return (
    <View style={[styles.container, style]}>
      {items.map((menuItem: MenuItemType, i: number) =>
        <View key={i} style={styles.menuItem}>
          <Text style={styles.name}>{menuItem.name}</Text>
          <Text style={styles.price}>{menuItem.price}</Text>
        </View>
      )}
    </View>
  )
}
