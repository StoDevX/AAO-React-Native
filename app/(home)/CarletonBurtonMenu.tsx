import * as React from 'react'
import {Stack} from 'expo-router'

import {CarletonBurtonMenuScreen} from '../../source/views/menus'

export default function CarletonBurtonMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Burton</Stack.Title>
			<CarletonBurtonMenuScreen />
		</>
	)
}
