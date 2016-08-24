// @flow

import KSTOView from './radio'
// import WeeklyMovieView from './movie'
import WebcamsView from './webcams'

export default [
  {
    id: 'radio',
    title: 'KSTO',
    rnVectorIcon: {iconName: 'radio'},
    component: KSTOView,
  },
  // {
  //   id: 'movie',
  //   title: 'Weekly Movie',
  //   rnVectorIcon: {iconName: 'film'},
  //   component: WeeklyMovieView,
  // },
  {
    id: 'webcams',
    title: 'Webcams',
    rnVectorIcon: {iconName: 'videocam'},
    component: WebcamsView,
  },
]
