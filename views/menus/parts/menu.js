// @flow
import React from 'react'
import {
  StyleSheet,
  ScrollView,
} from 'react-native'

import {MenuSection} from './menu-section'
import type {MenuSectionType} from '../simple-types'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
})

export function MenuView({menu}: {menu: MenuSectionType[]}) {
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
