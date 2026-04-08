import React from 'react'
import {createBottomTabNavigator as createCupertinoBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {ParamListBase} from '@react-navigation/native'

export interface Tab<TabNavigatorParams> {
	enabled?: true | false | undefined
	name: Extract<keyof TabNavigatorParams, string>
	component: () => JSX.Element
	tabBarLabel: string
	tabBarIcon:
		| undefined
		| (({color, focused}: {color: string; focused: boolean}) => JSX.Element)
}

export function IosTabbedView<
	P extends ParamListBase,
	T extends ReturnType<typeof createCupertinoBottomTabNavigator<P>>,
>(Tabs: T, screens: readonly Tab<P>[]): JSX.Element {
	return (
		<Tabs.Navigator screenOptions={{headerShown: false}}>
			{screens.map(({name, component, tabBarLabel, tabBarIcon}, i) => (
				<Tabs.Screen
					key={i}
					component={component}
					name={name}
					options={{tabBarLabel, tabBarIcon}}
				/>
			))}
		</Tabs.Navigator>
	)
}

export function createTabNavigator<Params extends ParamListBase>(
	tabs: readonly Tab<Params>[],
): () => JSX.Element {
	tabs = tabs.filter((tab) => tab.enabled !== false)

	let view = (() => {
		const IosTabs = createCupertinoBottomTabNavigator<Params>()
		return IosTabbedView<Params, typeof IosTabs>(IosTabs, tabs)
	})()

	return () => view
}
