import * as React from 'react'

// import WeeklyMovieView from './movie'
import {WebcamsView} from './webcams'
import {StreamListView} from './streams'
import {KstoStationView} from './radio/station-ksto'
import {KrlxStationView} from './radio/station-krlx'
export {KSTOScheduleView, KRLXScheduleView} from './radio'

import {TabBarIcon} from '@frogpond/navigation-tabs'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

type Params = {
	StreamingView: undefined
	LiveWebcamsView: undefined
	KSTORadioView: undefined
	KRLXRadioView: undefined
	// WeeklyMovieView: undefined
}

const Tabs = createBottomTabNavigator<Params>()

const StreamingView = () => <StreamListView />
const LiveWebcamsView = () => <WebcamsView />
const KSTOView = () => <KstoStationView />
const KRLXView = () => <KrlxStationView />
// const MovieView = () => <WeeklyMovieView />

const StreamingMediaView = (): JSX.Element => {
	return (
		<Tabs.Navigator>
			<Tabs.Screen
				component={StreamingView}
				name="StreamingView"
				options={{
					tabBarLabel: 'Streaming',
					tabBarIcon: TabBarIcon('recording'),
					headerShown: false,
				}}
			/>
			<Tabs.Screen
				component={LiveWebcamsView}
				name="LiveWebcamsView"
				options={{
					tabBarLabel: 'Webcams',
					tabBarIcon: TabBarIcon('videocam'),
					headerShown: false,
				}}
			/>
			<Tabs.Screen
				component={KSTOView}
				name="KSTORadioView"
				options={{
					tabBarLabel: 'KSTO',
					tabBarIcon: TabBarIcon('radio'),
					headerShown: false,
				}}
			/>
			<Tabs.Screen
				component={KRLXView}
				name="KRLXRadioView"
				options={{
					tabBarLabel: 'KRLX',
					tabBarIcon: TabBarIcon('mic'),
					headerShown: false,
				}}
			/>
			{/* <Tabs.Screen
				component={MovieView}
				name="WeeklyMovieView"
				options={{
					tabBarLabel: 'Weekly Movie',
					tabBarIcon: TabBarIcon('film'),
					headerShown: false,
				}}
			/> */}
		</Tabs.Navigator>
	)
}

export {StreamingMediaView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Streaming Media',
}

export const KSTOScheduleNavigationOptions: NativeStackNavigationOptions = {
	title: 'KSTO Schedule',
}

export const KRLXScheduleNavigationOptions: NativeStackNavigationOptions = {
	title: 'KRLX Schedule',
}

export type NavigationParams = undefined
