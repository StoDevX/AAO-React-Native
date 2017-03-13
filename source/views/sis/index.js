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
          rnVectorIcon: {iconName: 'card'},
          component: BalancesView,
        },
        {
          id: 'CoursesView',
          title: 'Courses',
          rnVectorIcon: {iconName: 'archive'},
          component: CoursesView,
        },
        // {
        //   id: 'CourseSearchView',
        //   title: 'Search',
        //   icon: {uri: base64Icon, scale: 3},
        //   component: () => <SearchView />,
        // },
      ]}
    />
  )
}
SISView.propTypes = {
  navigator: React.PropTypes.object.isRequired,
  route: React.PropTypes.object.isRequired,
}
