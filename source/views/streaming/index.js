// @flow

import {TabNavigator} from '../components/tabbed-view'

import {KSTOView} from './radio'
// import WeeklyMovieView from './movie'
import {WebcamsView} from './webcams'
import {StreamListView} from './streams'

export {KSTOScheduleView} from './radio'

export default TabNavigator(
  {
    StreamingView: {screen: StreamListView},
    LiveWebcamsView: {screen: WebcamsView},
    KSTORadioView: {screen: KSTOView},
    // WeeklyMovieView: {screen: WeeklyMovieView},
  },
  {
    navigationOptions: {
      title: 'Streaming Media',
    },
  },
)
