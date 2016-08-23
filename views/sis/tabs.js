// @flow
import BalancesView from './balances'
import CoursesView from './courses'
// import SearchView from './search'

export default [
  {
    id: 'balances',
    title: 'Balances',
    rnVectorIcon: {iconName: 'card'},
    content: BalancesView,
  },
  {
    id: 'courses',
    title: 'Courses',
    rnVectorIcon: {iconName: 'archive'},
    content: CoursesView,
  },
  // {
  //   id: 'search',
  //   title: 'Search',
  //   icon: {uri: base64Icon, scale: 3},
  //   content: () => <SearchView />,
  // },
]
