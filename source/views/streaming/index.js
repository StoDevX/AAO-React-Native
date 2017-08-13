// @flow
/**
 * All About Olaf
 * Media page
 */

import {TabNavigator} from '../components/tabbed-view'

import KSTOView from './radio'
// import WeeklyMovieView from './movie'
import WebcamsView from './webcams'
import {StreamListView} from './streams'

export default TabNavigator(
  {
    KSTORadioView: {screen: KSTOView},
    // WeeklyMovieView: {screen: WeeklyMovieView},
    LiveWebcamsView: {screen: WebcamsView},
    StreamingView: {screen: StreamListView},
  },
  {
    navigationOptions: {
      title: 'Streaming Media',
    },
  },
)
