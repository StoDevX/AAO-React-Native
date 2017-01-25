// @flow
import React from 'react'
import {StyleSheet} from 'react-native'
import AlphabetListView from 'react-native-alphabetlistview'
import * as c from '../components/colors'

const styles = StyleSheet.create({
  listView: {
    paddingRight: 21,
    backgroundColor: c.white,
  },
  sectionItems: {
    alignItems: 'center',
    right: 3,
  },
})

export function StyledAlphabetListView(props: Object) {
  return (
    <AlphabetListView
      contentContainerStyle={styles.listView}
      sectionListStyle={styles.sectionItems}
      initialListSize={12}
      pageSize={8}
      {...props}
    />
  )
}
