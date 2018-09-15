// @flow

import {TabNavigator} from '../../../modules/navigation-tabs/tabbed-view'

import {WeeklyMovieView} from './movie'
import {WebcamsView} from './webcams'
import {StreamListView} from './streams'
import {KstoStationView} from './radio/station-ksto'
import {KrlxStationView} from './radio/station-krlx'

export {KSTOScheduleView, KRLXScheduleView} from './radio'

const StreamingMediaView = TabNavigator({
    StreamingView: {screen: StreamListView},
    LiveWebcamsView: {screen: WebcamsView},
    KSTORadioView: {screen: KstoStationView},
    KRLXRadioView: {screen: KrlxStationView},
    WeeklyMovieView: {screen: WeeklyMovieView},
})

StreamingMediaView.navigationOptions = {
    title: 'Streaming Media',
}

export default StreamingMediaView