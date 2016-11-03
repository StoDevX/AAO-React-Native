// @flow
import React from 'react'
import {
  StyleSheet,
  ScrollView,
} from 'react-native'

import MenuSection from './menuSection'
import type {MenuSectionType} from './types'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
})

export default function MenuView({menu}: {menu: MenuSectionType[]}) {
  return (
    <ScrollView style={styles.container}>
      {menu.map((data: MenuSectionType, i: number) =>
        <MenuSection
          key={i}
          title={data.name}
          items={data.items}
          subtext={data.subtext}
        />)}
    </ScrollView>
  )
}
