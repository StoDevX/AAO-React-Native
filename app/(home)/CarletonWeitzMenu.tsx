import * as React from 'react'
import {Stack} from 'expo-router'
import {
	CarletonWeitzMenuScreen,
	WeitzNavigationOptions,
} from '../../source/views/menus'

export default function CarletonWeitzMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					WeitzNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<CarletonWeitzMenuScreen />
		</>
	)
}
