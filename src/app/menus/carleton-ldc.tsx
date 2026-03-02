import React from 'react'
import {CarletonLDCMenuScreen} from '../../views/menus/carleton-menus'
import {Stack} from 'expo-router'

export default function CarletonLDCScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'LDC'}} />
			<CarletonLDCMenuScreen />
		</>
	)
}
