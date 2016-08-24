// @flow
import BalancesView from './balances'
import CoursesView from './courses'
// import SearchView from './search'

export default [
  {
    id: 'balances',
    title: 'Balances',
    rnVectorIcon: {iconName: 'card'},
    component: BalancesView,
  },
  {
    id: 'courses',
    title: 'Courses',
    rnVectorIcon: {iconName: 'archive'},
    component: CoursesView,
  },
  // {
  //   id: 'search',
  //   title: 'Search',
  //   icon: {uri: base64Icon, scale: 3},
  //   component: () => <SearchView />,
  // },
]
