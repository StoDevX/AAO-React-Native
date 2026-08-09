import * as React from 'react'
import {Stack} from 'expo-router'

export default function HomeLayout(): React.ReactNode {
	return (
		<Stack>
			<Stack.Screen name="Menus" options={{title: 'Menus'}} />
			<Stack.Screen
				name="Streaming Media"
				options={{title: 'Streaming Media'}}
			/>
			<Stack.Screen name="News" options={{title: 'News'}} />
			<Stack.Screen name="Transportation" options={{title: 'Transportation'}} />
		</Stack>
	)
}
