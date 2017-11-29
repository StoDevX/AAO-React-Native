// @flow
import * as React from 'react'
import {StyleSheet} from 'react-native'
import AlphabetListView from '@hawkrives/react-native-alphabetlistview'
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
      initialListSize={StyledAlphabetListView.initialListSize}
      pageSize={StyledAlphabetListView.pageSize}
      sectionListStyle={styles.sectionItems}
      {...props}
    />
  )
}
StyledAlphabetListView.initialListSize = 12
StyledAlphabetListView.pageSize = 8
