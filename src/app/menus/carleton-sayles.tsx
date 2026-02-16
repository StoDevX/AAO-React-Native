import * as React from 'react'
import {Stack} from 'expo-router'
import {CarletonSaylesMenuScreen} from './carleton-menus'

export default function CarletonSaylesRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Sayles Hill'}} />
			<CarletonSaylesMenuScreen />
		</>
	)
}
