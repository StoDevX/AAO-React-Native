// @flow

import * as React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

import {RadioControllerView} from './radio'
// import WeeklyMovieView from './movie'
import {WebcamsView} from './webcams'
import {StreamListView} from './streams'

export {KSTOScheduleView} from './radio'

export default TabNavigator(
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
		// WeeklyMovieView: {screen: WeeklyMovieView},
	},
	{
		navigationOptions: {
			title: 'Streaming Media',
		},
	},
)
