import React from 'react'
import {CarletonWeitzMenuScreen} from '../../views/menus/carleton-menus'
import {Stack} from 'expo-router'

export default function CarletonWeitzScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Weitz Center'}} />
			<CarletonWeitzMenuScreen />
		</>
	)
}
