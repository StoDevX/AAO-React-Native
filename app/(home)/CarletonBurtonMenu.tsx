import * as React from 'react'
import {Stack} from 'expo-router'
import {
	CarletonBurtonMenuScreen,
	BurtonNavigationOptions,
} from '../../source/views/menus'

export default function CarletonBurtonMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					BurtonNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<CarletonBurtonMenuScreen />
		</>
	)
}
