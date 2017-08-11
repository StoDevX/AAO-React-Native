// @flow
/**
 * All About Olaf
 * Media page
 */

import {TabNavigator} from '../components/tabbed-view'

import KSTOView from './radio'
// import WeeklyMovieView from './movie'
import WebcamsView from './webcams'
import StreamingView from './stream'

export default TabNavigator(
  {
    //KSTORadioView: {screen: KSTOView},
    // WeeklyMovieView: {screen: WeeklyMovieView},
    //LiveWebcamsView: {screen: WebcamsView},
    StreamingView: {screen: StreamingView},
  },
  {
    navigationOptions: {
      title: 'Streaming Media',
    },
  },
)
