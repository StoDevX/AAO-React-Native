import FontAwesome from '@expo/vector-icons/FontAwesome'
import {Tabs} from 'expo-router'

export default function TabLayout(): React.JSX.Element {
	return (
		<Tabs screenOptions={{tabBarActiveTintColor: 'blue'}}>
			<Tabs.Screen
				name="express"
				options={{
					title: 'Express Bus',
					tabBarIcon: ({color}) => (
						<FontAwesome size={28} name="bus" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="red-line"
				options={{
					title: 'Red Line',
					tabBarIcon: ({color}) => (
						<FontAwesome size={28} name="bus" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="pause"
				options={{
					title: 'Blue Line',
					tabBarIcon: ({color}) => (
						<FontAwesome size={28} name="bus" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="oles-go"
				options={{
					title: 'Oles Go',
					tabBarIcon: ({color}) => (
						<FontAwesome size={28} name="car" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="other-modes"
				options={{
					title: 'Other Modes',
					tabBarIcon: ({color}) => (
						<FontAwesome size={28} name="ship" color={color} />
					),
				}}
			/>
		</Tabs>
	)
}
