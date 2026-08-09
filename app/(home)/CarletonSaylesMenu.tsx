import * as React from 'react'
import {Stack} from 'expo-router'

import {CarletonSaylesMenuScreen} from '../../source/views/menus'

export default function CarletonSaylesMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Sayles</Stack.Title>
			<CarletonSaylesMenuScreen />
		</>
	)
}
