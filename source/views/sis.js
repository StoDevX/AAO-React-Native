// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {TabNavigator, TabBarIcon} from '../components/tabbed-view'

import {BalancesView as Balances} from '../modules/onecard-balances'
import {
  StudentWorkView as StuWork,
  JobDetailView,
} from '../modules/student-work'
// import CoursesView from '../modules/current-courses'
// import SearchView from '../modules/course-search'

const BalancesView = {
  screen: Balances,
  navigationOptions: {
    tabBarLabel: 'Balances',
    tabBarIcon: TabBarIcon('card'),
  },
}

const StudentWorkView = {
  screen: StuWork,
  navigationOptions: {
    tabBarLabel: 'Open Jobs',
    tabBarIcon: TabBarIcon('briefcase'),
  },
}

const SisView = TabNavigator(
  {
    BalancesView,
    StudentWorkView,
    // CoursesView: {screen: CoursesView},
    // CourseSearchView: {screen: CourseSearchView},
  },
  {
    navigationOptions: {
      title: 'SIS',
    },
  },
)

export const navigation: AppNavigationType = {
  SISView: {screen: SisView},
  JobDetailView: {screen: JobDetailView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'SISView',
  title: 'SIS',
  icon: 'fingerprint',
  tint: c.goldenrod,
  gradient: c.yellowToGoldDark,
}
