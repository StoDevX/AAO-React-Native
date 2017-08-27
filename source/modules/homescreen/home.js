/**
 * @flow
 * All About Olaf
 * iOS Home page
 */

import React from 'react'
import {ScrollView, StyleSheet, StatusBar} from 'react-native'

import {connect} from 'react-redux'
import * as c from '../../components/colors'
import sortBy from 'lodash/sortBy'
import type {TopLevelViewPropsType} from '../types'
import type {VisibleHomescreenViewType} from '../../app/types'
import {homeViews} from '../../app/views'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {trackedOpenUrl} from '../../components/open-url'

function HomePage({
  navigation,
  order,
  views = homeViews,
}: {
  order: string[],
  views: VisibleHomescreenViewType[],
} & TopLevelViewPropsType) {
  const sortedViews = sortBy(views, view => order.indexOf(view.view))

  return (
    <ScrollView
      overflow="hidden"
      alwaysBounceHorizontal={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.cells}
    >
      <StatusBar barStyle="light-content" backgroundColor={c.gold} />

      {sortedViews.map(view =>
        <HomeScreenButton
          key={view.view}
          view={view}
          onPress={() => {
            if (view.type === 'url') {
              return trackedOpenUrl({url: view.url, id: view.view})
            } else {
              return navigation.navigate(view.view)
            }
          }}
        />,
      )}
    </ScrollView>
  )
}

function mapStateToProps(state) {
  return {
    order: state.homescreen.order,
  }
}
export default connect(mapStateToProps)(HomePage)

const styles = StyleSheet.create({
  cells: {
    marginHorizontal: CELL_MARGIN / 2,
    marginTop: CELL_MARGIN / 2,
    paddingBottom: CELL_MARGIN / 2,

    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
