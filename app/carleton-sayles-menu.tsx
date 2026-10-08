import * as React from 'react'

import {CarletonCafeMenu} from '../source/features/menus/carleton-cafe-menu'
import {MenuHeaderHost, MenuHeaderProvider} from '../source/features/menus/menu-header'

export default function CarletonSaylesMenuPage(): React.ReactNode {
	return (
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<CarletonCafeMenu cafe="sayles" />
		</MenuHeaderProvider>
	)
}
