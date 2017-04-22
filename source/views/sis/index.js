// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'

import type {TopLevelViewPropsType} from '../types'
import TabbedView from '../components/tabbed-view'
import BalancesView from './balances'
// import CoursesView from './courses'
// import SearchView from './search'

export default function SISView({navigator, route}: TopLevelViewPropsType) {
  return (
    <TabbedView
      tabs={[
        {
          id: 'BalancesView',
          title: 'Balances',
          icon: 'card',
          component: () => <BalancesView navigator={navigator} route={route} />,
        },
        // {
        //   id: 'CoursesView',
        //   title: 'Courses',
        //   icon: 'archive',
        //   component: () => <CoursesView navigator={navigator} route={route} />,
        // },
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
