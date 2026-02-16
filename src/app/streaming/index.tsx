import {Platform} from 'react-native'
import {
	MaterialIcon,
	IosIcon,
	createTabNavigator,
	type Tab,
} from '@frogpond/navigation-tabs'

import {WeeklyMovieView} from './movie'
import {WebcamsView} from './webcams'
import {StreamListView} from './streams'
import {KstoStationView} from './radio/station-ksto'
import {KrlxStationView} from './radio/station-krlx'

type Params = {
	StreamingView: undefined
	LiveWebcamsView: undefined
	KSTORadioView: undefined
	KRLXRadioView: undefined
	WeeklyMovieView: undefined
}

const tabs: Tab<Params>[] = [
	{
		name: 'StreamingView',
		component: StreamListView,
		tabBarLabel: 'Streaming',
		tabBarIcon: Platform.select({
			ios: IosIcon('recording'),
			android: MaterialIcon('camcorder'),
		}),
	},
	{
		name: 'LiveWebcamsView',
		component: WebcamsView,
		tabBarLabel: 'Webcams',
		tabBarIcon: Platform.select({
			ios: IosIcon('videocam'),
			android: MaterialIcon('webcam'),
		}),
	},
	{
		name: 'KSTORadioView',
		component: KstoStationView,
		tabBarLabel: 'KSTO',
		tabBarIcon: Platform.select({
			ios: IosIcon('radio'),
			android: MaterialIcon('radio'),
		}),
	},
	{
		name: 'KRLXRadioView',
		component: KrlxStationView,
		tabBarLabel: 'KRLX',
		tabBarIcon: Platform.select({
			ios: IosIcon('mic'),
			android: MaterialIcon('microphone'),
		}),
	},
	{
		enabled: false,
		name: 'WeeklyMovieView',
		component: WeeklyMovieView,
		tabBarLabel: 'Weekly Movie',
		tabBarIcon: Platform.select({
			ios: IosIcon('film'),
			android: MaterialIcon('film'),
		}),
	},
]

const StreamingView = createTabNavigator<Params>(tabs)
export default StreamingView
