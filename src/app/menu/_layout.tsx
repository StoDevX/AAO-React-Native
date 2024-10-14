import FontAwesome from '@expo/vector-icons/FontAwesome'
import {Tabs} from 'expo-router'

export default function TabLayout(): React.JSX.Element {
	return (
		<Tabs screenOptions={{tabBarActiveTintColor: 'blue', headerShown: false}}>
			<Tabs.Screen
				name="stav"
				options={{
					title: 'Stav Hall',
					tabBarIcon: ({color}) => (
						<FontAwesome size={28} name="home" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="cage"
				options={{
					title: 'The Cage',
					tabBarIcon: ({color}) => (
						<FontAwesome size={28} name="cog" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="pause"
				options={{
					title: 'The Pause',
					tabBarIcon: ({color}) => (
						<FontAwesome size={28} name="paw" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="carleton"
				options={{
					title: 'Carleton',
					tabBarIcon: ({color}) => (
						<FontAwesome size={28} name="university" color={color} />
					),
				}}
			/>
		</Tabs>
	)
}
