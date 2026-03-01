import React from 'react'
import {CarletonBurtonMenuScreen} from '../../views/menus/carleton-menus'
import {Stack} from 'expo-router'

export default function CarletonBurtonScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Burton'}} />
			<CarletonBurtonMenuScreen />
		</>
	)
}
