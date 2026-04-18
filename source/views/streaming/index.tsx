import * as React from 'react'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'

import {WebcamsView} from './webcams'
import {StreamListView} from './streams'
import {KstoStationView} from './radio/station-ksto'
import {KrlxStationView} from './radio/station-krlx'

export {KSTOScheduleView, KRLXScheduleView} from './radio'

type Params = {
	StreamingView: undefined
	LiveWebcamsView: undefined
	KSTORadioView: undefined
	KRLXRadioView: undefined
}

const Tab = createNativeBottomTabNavigator<Params>()

export const View = (): React.ReactNode => (
	<Tab.Navigator screenOptions={{headerShown: false}}>
		<Tab.Screen
			component={StreamListView}
			name="StreamingView"
			options={{
				tabBarLabel: 'Streaming',
				tabBarIcon: {type: 'sfSymbol', name: 'recordingtape'},
			}}
		/>
		<Tab.Screen
			component={WebcamsView}
			name="LiveWebcamsView"
			options={{
				tabBarLabel: 'Webcams',
				tabBarIcon: {type: 'sfSymbol', name: 'web.camera.fill'},
			}}
		/>
		<Tab.Screen
			component={KstoStationView}
			name="KSTORadioView"
			options={{
				tabBarLabel: 'KSTO',
				tabBarIcon: {type: 'sfSymbol', name: 'radio.fill'},
			}}
		/>
		<Tab.Screen
			component={KrlxStationView}
			name="KRLXRadioView"
			options={{
				tabBarLabel: 'KRLX',
				tabBarIcon: {type: 'sfSymbol', name: 'mic.fill'},
			}}
		/>
	</Tab.Navigator>
)

export type NavigationParams = undefined
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
