import React from 'react'
import {CarletonSaylesMenuScreen} from '../../views/menus/carleton-menus'
import {Stack} from 'expo-router'

export default function CarletonSaylesScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Sayles Hill'}} />
			<CarletonSaylesMenuScreen />
		</>
	)
}
