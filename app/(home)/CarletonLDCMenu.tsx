import * as React from 'react'
import {Stack} from 'expo-router'

import {CarletonLDCMenuScreen} from '../../source/views/menus'

export default function CarletonLDCMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>LDC</Stack.Title>
			<CarletonLDCMenuScreen />
		</>
	)
}
