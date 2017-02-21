/**
 * @flow
 * All About Olaf
 * iOS Home page
 */

import React from 'react'
import {
  Navigator,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native'

import { connect } from 'react-redux'
import * as c from '../components/colors'
import sortBy from 'lodash/sortBy'
import type {TopLevelViewPropsType} from '../types'
import type {ViewType} from '../views'
import {allViews} from '../views'
import {HomeScreenButton, CELL_MARGIN} from './button'


function HomePage({navigator, route, order, views=allViews}: {order: string[], views: ViewType[]} & TopLevelViewPropsType) {
  const sortedViews = sortBy(views, view => order.indexOf(view.view))

  return (
    <ScrollView
      overflow='hidden'
      alwaysBounceHorizontal={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.cells}
    >
      <StatusBar barStyle='light-content' backgroundColor={c.gold} />

      {sortedViews.map(view =>
        <HomeScreenButton
          view={view}
          key={view.view}
          onPress={() => navigator.push({
            id: view.view,
            index: route.index + 1,
            title: view.title,
            backButtonTitle: 'Home',
            sceneConfig: Navigator.SceneConfigs.PushFromRight,
          })}
        />)
      }
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
