import * as React from 'react'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'

import {MainTabParamList} from './types'
import {
	TodayStackScreens,
	MenusStackScreens,
	SISStackScreens,
	RadioStackScreens,
	BrowseStackScreens,
} from './stacks/tab-stacks'

const Tab = createNativeBottomTabNavigator<MainTabParamList>()

export const MainTabNavigator = (): React.ReactNode => (
	<Tab.Navigator screenOptions={{headerShown: false}}>
		<Tab.Screen
			component={TodayStackScreens}
			name="TodayTab"
			options={{
				tabBarLabel: 'Today',
				tabBarIcon: {type: 'sfSymbol', name: 'sun.max.fill'},
			}}
		/>
		<Tab.Screen
			component={MenusStackScreens}
			name="MenusTab"
			options={{
				tabBarLabel: 'Menus',
				tabBarIcon: {type: 'sfSymbol', name: 'fork.knife'},
			}}
		/>
		<Tab.Screen
			component={SISStackScreens}
			name="SISTab"
			options={{
				tabBarLabel: 'SIS',
				tabBarIcon: {type: 'sfSymbol', name: 'graduationcap.fill'},
			}}
		/>
		<Tab.Screen
			component={RadioStackScreens}
			name="RadioTab"
			options={{
				tabBarLabel: 'Radio',
				tabBarIcon: {type: 'sfSymbol', name: 'dot.radiowaves.left.and.right'},
			}}
		/>
		<Tab.Screen
			component={BrowseStackScreens}
			name="BrowseTab"
			options={{
				tabBarLabel: 'Browse',
				tabBarIcon: {type: 'sfSymbol', name: 'square.grid.2x2.fill'},
			}}
		/>
	</Tab.Navigator>
)
