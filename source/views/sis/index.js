// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'

import {TabbedView} from '../components/tabbed-view'
import type {TopLevelViewPropsType} from '../types'

import BalancesView from './balances'
import CoursesView from './courses'
// import SearchView from './search'

export default function SISView({navigator, route}: TopLevelViewPropsType) {
  return (
    <TabbedView
      tabs={[
        {
          id: 'BalancesView',
          title: 'Balances',
          icon: 'card',
          render: () => <BalancesView route={route} navigator={navigator} />,
        },

        {
          id: 'CoursesView',
          title: 'Courses',
          icon: 'archive',
          render: () => <CoursesView route={route} navigator={navigator} />,
        },

        // {id:'CourseSearchView', title:'Search', icon:'search', render:() => <SearchView route={route} navigator={navigator} />},
      ]}
    />
  )
}
