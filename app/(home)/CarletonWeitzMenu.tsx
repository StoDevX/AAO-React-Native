import * as React from 'react'
import {Stack} from 'expo-router'

import {CarletonWeitzMenuScreen} from '../../source/views/menus'

export default function CarletonWeitzMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Weitz</Stack.Title>
			<CarletonWeitzMenuScreen />
		</>
	)
}
