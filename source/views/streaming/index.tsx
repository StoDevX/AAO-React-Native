import {Platform} from 'react-native'

import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {
	createTabNavigator,
	IosIcon,
	MaterialIcon,
	type Tab,
} from '@frogpond/navigation-tabs'

import {WeeklyMovieView} from './movie'
import {KrlxStationView} from './radio/station-krlx'
import {KstoStationView} from './radio/station-ksto'
import {StreamListView} from './streams'
import {WebcamsView} from './webcams'

export {KRLXScheduleView, KSTOScheduleView} from './radio'

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

export type NavigationParams = undefined
export const View = createTabNavigator<Params>(tabs)
export const NavigationKey = 'Streaming Media'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Streaming Media',
}

export const KSTOScheduleNavigationOptions: NativeStackNavigationOptions = {
	title: 'KSTO Schedule',
}

export const KRLXScheduleNavigationOptions: NativeStackNavigationOptions = {
	title: 'KRLX Schedule',
}
