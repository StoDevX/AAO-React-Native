import * as React from 'react'
import {Stack} from 'expo-router'
import {CarletonWeitzMenuScreen} from './carleton-menus'

export default function CarletonWeitzRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Weitz Center'}} />
			<CarletonWeitzMenuScreen />
		</>
	)
}
