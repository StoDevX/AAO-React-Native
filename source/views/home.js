// @flow
/**
 * All About Olaf
 * iOS Home page
 */

import React from 'react'
import {
  Navigator,
  ScrollView,
  StyleSheet,
  Text,
  StatusBar,
  Platform,
} from 'react-native'
import {Touchable} from './components/touchable'

import { connect } from 'react-redux'
import Icon from 'react-native-vector-icons/Entypo'
import * as c from './components/colors'
import sortBy from 'lodash/sortBy'
import type {TopLevelViewPropsType} from './types'

const Dimensions = require('Dimensions')
let Viewport = Dimensions.get('window')

import type {ViewType} from './views'
import {allViews} from './views'

function HomeScreenButton({view, onPress}: {view: ViewType, onPress: () => any}) {
  return (
    <Touchable highlight={false} onPress={onPress} style={[styles.rectangle, {backgroundColor: view.tint}]}>
      <Icon name={view.icon} size={32} style={styles.rectangleButtonIcon} />
      <Text style={styles.rectangleButtonText}>
        {view.title}
      </Text>
    </Touchable>
  )
}

function HomePage({navigator, route, order, views=allViews}: {order: string[], views: ViewType[]} & TopLevelViewPropsType) {
  const sortedViews = sortBy(views, view => order.indexOf(view.view))

  return (
    <ScrollView
      overflow='hidden'
      alwaysBounceHorizontal={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
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


let cellMargin = 10
let cellSidePadding = 8
let cellEdgePadding = 4
let cellWidth = (Viewport.width / 2) - (cellMargin * 1.5)

let styles = StyleSheet.create({
  // Body container
  cells: {
    marginHorizontal: cellMargin / 2,
    marginTop: cellMargin / 2,
    paddingBottom: cellMargin / 2,

    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  rows: {},

  scrollView: {
    // elevation: 2,
  },

  // Main buttons for actions on home screen
  rectangle: {
    width: cellWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: cellSidePadding,
    paddingBottom: cellSidePadding / 2,
    paddingHorizontal: cellEdgePadding,
    borderRadius: Platform.OS === 'ios' ? 6 : 3,
    elevation: 2,

    marginTop: cellMargin / 2,
    marginBottom: cellMargin / 2,
    marginLeft: cellMargin / 2,
    marginRight: cellMargin / 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgb(224, 224, 224)',
  },

  listIcon: {
    paddingLeft: 15,
    paddingRight: 30,
  },
  listText: {
    fontSize: 16,
  },

  // Text styling in buttons
  rectangleButtonIcon: {
    color: c.white,
  },
  rectangleButtonText: {
    color: c.white,
    marginTop: cellSidePadding / 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
    textAlign: 'center',
    fontSize: 14,
  },
})
