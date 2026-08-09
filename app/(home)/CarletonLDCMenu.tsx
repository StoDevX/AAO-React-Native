import * as React from 'react'
import {Stack} from 'expo-router'
import {
	CarletonLDCMenuScreen,
	LDCNavigationOptions,
} from '../../source/views/menus'

export default function CarletonLDCMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					LDCNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<CarletonLDCMenuScreen />
		</>
	)
}
