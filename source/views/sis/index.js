// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import TabbedView from '../components/tabbed-view'
import BalancesView from './balances'
import CoursesView from './courses'
// import SearchView from './search'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default function SISView(props: {navigator: any, route: any}) {
  return (
    <TabbedView
      navigator={props.navigator}
      route={props.route}
      style={styles.container}
      tabs={[
        {
          id: 'BalancesView',
          title: 'Balances',
          icon: 'card',
          component: BalancesView,
        },
        {
          id: 'CoursesView',
          title: 'Courses',
          icon: 'archive',
          component: CoursesView,
        },
        // {
        //   id: 'CourseSearchView',
        //   title: 'Search',
        //   icon: 'search',
        //   component: SearchView,
        // },
      ]}
    />
  )
}
SISView.propTypes = {
  navigator: React.PropTypes.object.isRequired,
  route: React.PropTypes.object.isRequired,
}
