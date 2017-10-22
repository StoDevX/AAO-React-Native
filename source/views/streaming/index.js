// @flow

import * as React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

<<<<<<< HEAD
import {RadioControllerView} from './radio'
// import WeeklyMovieView from './movie'
=======
import KSTOView from './radio'
import {WeeklyMovieView} from './movie'
>>>>>>> activate the movie view
import {WebcamsView} from './webcams'
import {StreamListView} from './streams'

export {KSTOScheduleView, KRLXScheduleView} from './radio'

export default TabNavigator(
<<<<<<< HEAD
	{
		StreamingView: {screen: StreamListView},
		LiveWebcamsView: {screen: WebcamsView},
		KSTORadioView: {
			screen: ({navigation}) => (
				<RadioControllerView
					image={require('../../../images/streaming/ksto.png')}
					navigation={navigation}
					playerUrl="https://www.stolaf.edu/multimedia/play/embed/ksto.html"
					scheduleViewName="KSTOScheduleView"
					source={{
						useEmbeddedPlayer: true,
						embeddedPlayerUrl:
							'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
						streamSourceUrl: '',
					}}
					stationName="KSTO 93.1 FM"
					stationNumber="+15077863602"
					title="St. Olaf College Radio"
				/>
			),
			navigationOptions: {
				tabBarLabel: 'KSTO',
				tabBarIcon: TabBarIcon('radio'),
			},
		},
		KRLXRadioView: {
			screen: ({navigation}) => (
				<RadioControllerView
					image={require('../../../images/streaming/krlx.png')}
					navigation={navigation}
					playerUrl="http://live.krlx.org"
					scheduleViewName="KRLXScheduleView"
					source={{
						useEmbeddedPlayer: false,
						embeddedPlayerUrl: 'http://live.krlx.org',
						streamSourceUrl: 'http://radio.krlx.org/mp3/high_quality',
					}}
					stationName="88.1 KRLX-FM"
					stationNumber="+15072224127"
					title="Carleton College Radio"
				/>
			),
			navigationOptions: {
				tabBarLabel: 'KRLX',
				tabBarIcon: TabBarIcon('microphone'),
			},
		},
		// WeeklyMovieView: {screen: WeeklyMovieView},
	},
	{
		navigationOptions: {
			title: 'Streaming Media',
		},
	},
=======
  {
    StreamingView: {screen: StreamListView},
    LiveWebcamsView: {screen: WebcamsView},
    KSTORadioView: {screen: KSTOView},
    WeeklyMovieView: {screen: WeeklyMovieView},
  },
  {
    navigationOptions: {
      title: 'Streaming Media',
    },
  },
>>>>>>> activate the movie view
)
