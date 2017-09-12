/**
 * @flow
 * All About Olaf
 * iOS Home page
 */

import React from 'react'
import {ScrollView, StyleSheet, StatusBar} from 'react-native'

import {connect} from 'react-redux'
import * as c from '../components/colors'
import sortBy from 'lodash/sortBy'
import type {TopLevelViewPropsType} from '../types'
import type {ViewType} from '../views'
import {allViews} from '../views'
import {Column} from '../components/layout'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {trackedOpenUrl} from '../components/open-url'
import {EditHomeButton, OpenSettingsButton} from '../components/nav-buttons'

function partitionByIndex<T>(arr: T[]): [T[], T[]] {
  return arr.reduce(
    (acc, val, idx) => {
      return idx % 2 === 0
        ? [acc[0].concat(val), acc[1]]
        : [acc[0], acc[1].concat(val)]
    },
    [[], []],
  )
}

function HomePage({
  navigation,
  order,
  views = allViews,
}: {order: string[], views: ViewType[]} & TopLevelViewPropsType) {
  const sortedViews = sortBy(views, view => order.indexOf(view.view))

  const columns = partitionByIndex(sortedViews)

  return (
    <ScrollView
      overflow="hidden"
      alwaysBounceHorizontal={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.cells}
    >
      <StatusBar barStyle="light-content" backgroundColor={c.gold} />

      {columns.map((contents, i) =>
        <Column key={i} flex={1}>
          {contents.map(view =>
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
        </Column>,
      )}
    </ScrollView>
  )
}
HomePage.navigationOptions = ({navigation}) => {
  return {
    title: 'All About Olaf',
    headerBackTitle: 'Home',
    headerLeft: <OpenSettingsButton navigation={navigation} />,
    headerRight: <EditHomeButton navigation={navigation} />,
  }
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

    flexDirection: 'row',
  },
})
