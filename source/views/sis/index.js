// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import type {TopLevelViewPropsType} from '../types'
import TabbedView from '../components/tabbed-view'
import BalancesView from './balances'
import CoursesView from './courses'
// import SearchView from './search'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default function SISView({navigator, route}: TopLevelViewPropsType) {
  return (
    <TabbedView
      navigator={navigator}
      route={route}
      style={styles.container}
      tabs={[
        {
          id: 'BalancesView',
          title: 'Balances',
          icon: 'card',
          component: () => <BalancesView navigator={navigator} route={route} />,
        },
        {
          id: 'CoursesView',
          title: 'Courses',
          icon: 'archive',
          component: () => <CoursesView navigator={navigator} route={route} />,
        },
        // {
        //   id: 'CourseSearchView',
        //   title: 'Search',
        //   icon: 'search',
        //   component: () => <SearchView navigator={navigator} route={route} />,
        // },
      ]}
    />
  )
}
SISView.propTypes = {
  navigator: React.PropTypes.object.isRequired,
  route: React.PropTypes.object.isRequired,
}
