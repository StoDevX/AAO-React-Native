import * as React from 'react'
import {Stack} from 'expo-router'
import {CarletonBurtonMenuScreen} from './carleton-menus'

export default function CarletonBurtonRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Burton'}} />
			<CarletonBurtonMenuScreen />
		</>
	)
}
