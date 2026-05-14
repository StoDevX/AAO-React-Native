import * as React from 'react'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'

import * as newsImages from '../../../images/news-sources/index'
import {NewsList} from './news-list'
import {namedNewsOptions} from './query'
import {useQuery} from '@tanstack/react-query'

const StOlafNewsView = () => (
	<NewsList
		query={useQuery(namedNewsOptions('stolaf'))}
		thumbnail={newsImages.stolaf}
	/>
)
const MessNewsView = () => (
	<NewsList
		query={useQuery(namedNewsOptions('mess'))}
		thumbnail={newsImages.mess}
	/>
)

type Params = {
	StOlafNewsView: undefined
	MessNewsView: undefined
}

const Tab = createNativeBottomTabNavigator<Params>()

export const View = (): React.ReactNode => (
	<Tab.Navigator screenOptions={{headerShown: false}}>
		<Tab.Screen
			component={StOlafNewsView}
			name="StOlafNewsView"
			options={{
				tabBarLabel: 'St. Olaf',
				tabBarIcon: {type: 'sfSymbol', name: 'graduationcap.fill'},
			}}
		/>
		<Tab.Screen
			component={MessNewsView}
			name="MessNewsView"
			options={{
				tabBarLabel: 'The Mess',
				tabBarIcon: {type: 'sfSymbol', name: 'newspaper.fill'},
			}}
		/>
	</Tab.Navigator>
)

export type NavigationParams = undefined
export const NavigationKey = 'News'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'News',
}
