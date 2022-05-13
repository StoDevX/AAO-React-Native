import * as React from 'react'

import {TabBarIcon} from '@frogpond/navigation-tabs'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as newsImages from '../../../images/news-sources/index'
import {NewsList} from './news-list'

type Params = {
	StOlafNewsView: undefined
	MessNewsView: undefined
	OlevilleNewsView: undefined
}

const Tabs = createBottomTabNavigator<Params>()

const StOlafNewsView = () => (
	<NewsList source="stolaf" thumbnail={newsImages.stolaf.default} />
)
const MessNewsView = () => (
	<NewsList source="mess" thumbnail={newsImages.mess.default} />
)
const OlevilleNewsView = () => (
	<NewsList source="oleville" thumbnail={newsImages.oleville.default} />
)

const NewsView = (): JSX.Element => {
	return (
		<Tabs.Navigator>
			<Tabs.Screen
				component={StOlafNewsView}
				name="StOlafNewsView"
				options={{
					tabBarLabel: 'St. Olaf',
					tabBarIcon: TabBarIcon('school'),
					headerShown: false,
				}}
			/>
			<Tabs.Screen
				component={MessNewsView}
				name="MessNewsView"
				options={{
					tabBarLabel: 'The Mess',
					tabBarIcon: TabBarIcon('newspaper'),
					headerShown: false,
				}}
			/>
			<Tabs.Screen
				component={OlevilleNewsView}
				name="OlevilleNewsView"
				options={{
					tabBarLabel: 'Oleville',
					tabBarIcon: TabBarIcon('happy'),
					headerShown: false,
				}}
			/>
		</Tabs.Navigator>
	)
}

export {NewsView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'News',
}
