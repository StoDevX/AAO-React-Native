// @flow

import {TabNavigator} from '../components/tabbed-view'

import BalancesView from './balances'
import StudentWorkView from './student-work'
// import CoursesView from './courses'
// import SearchView from './search'

export default TabNavigator(
  {
    BalancesView: {screen: BalancesView},
    StudentWorkView: {screen: StudentWorkView},
    // CoursesView: {screen: CoursesView},
    // CourseSearchView: {screen: CourseSearchView},
  },
  {
    navigationOptions: {
      title: 'SIS',
    },
  },
)
