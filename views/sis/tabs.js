// @flow
import BalancesView from './balances'
import CoursesView from './courses'
// import SearchView from './search'

export default [
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
]
