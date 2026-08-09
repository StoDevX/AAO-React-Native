import * as React from 'react'
import {Stack} from 'expo-router'
import {
	CarletonSaylesMenuScreen,
	SaylesNavigationOptions,
} from '../../source/views/menus'

export default function CarletonSaylesMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					SaylesNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<CarletonSaylesMenuScreen />
		</>
	)
}
