// @flow

import * as React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'
import * as c from '../components/colors'

import {RadioControllerView} from './radio'
import {WeeklyMovieView} from '../streaming/movie'
import {WebcamsView} from './webcams'
import {StreamListView} from './streams'

export {KSTOScheduleView, KRLXScheduleView} from './radio'

export default TabNavigator(
	{
		WeeklyMovieView: {
			screen: WeeklyMovieView,
			navigationOptions: {
				tabBarLabel: 'Movie',
				tabBarIcon: TabBarIcon('film'),
				headerTintColor: c.white,
			},
		},

		// StreamingView: {
		// 	screen: StreamListView,
		// 	navigationOptions: {
		// 		tabBarLabel: 'Streaming',
		// 		tabBarIcon: TabBarIcon('recording'),
		// 	},
		// },

		LiveWebcamsView: {
			screen: WebcamsView,
			navigationOptions: {
				tabBarLabel: 'Webcams',
				tabBarIcon: TabBarIcon('videocam'),
			},
		},

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
					tint={c.kstoSecondaryDark}
					title="St. Olaf College Radio"
				/>
			),
			navigationOptions: {
				tabBarLabel: 'KSTO',
				tabBarIcon: TabBarIcon('radio'),
				headerStyle: {
					backgroundColor: c.kstoSecondaryDark,
				},
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
					tint={c.krlxDark}
					title="Carleton College Radio"
				/>
			),
			navigationOptions: {
				tabBarLabel: 'KRLX',
				tabBarIcon: TabBarIcon('microphone'),
				headerStyle: {
					backgroundColor: c.krlxDark,
				},
			},
		},
	},
	{
		navigationOptions: {
			title: 'Streaming Media',
		},
	},
)
