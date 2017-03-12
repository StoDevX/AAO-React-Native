// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'

import {TabbedView, Tab} from '../components/tabbed-view'
import type {TopLevelViewPropsType} from '../types'

import BalancesView from './balances'
import CoursesView from './courses'
// import SearchView from './search'

export default function SISView({navigator, route}: TopLevelViewPropsType) {
  return (
    <TabbedView>
      <Tab id="BalancesView" title="Balances" icon="card">
        {() => <BalancesView route={route} navigator={navigator} />}
      </Tab>

      <Tab id="CoursesView" title="Courses" icon="archive">
        {() => <CoursesView route={route} navigator={navigator} />}
      </Tab>

      {/*<Tab id='CourseSearchView' title='Search' icon='search'>
        {() => <SearchView route={route} navigator={navigator} />}
      </Tab>*/}
    </TabbedView>
  )
}
