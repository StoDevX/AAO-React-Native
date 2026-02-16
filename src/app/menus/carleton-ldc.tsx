import * as React from 'react'
import {Stack} from 'expo-router'
import {CarletonLDCMenuScreen} from './carleton-menus'

export default function CarletonLDCRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'LDC'}} />
			<CarletonLDCMenuScreen />
		</>
	)
}
