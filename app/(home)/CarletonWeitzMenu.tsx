import * as React from 'react'
import {Stack} from 'expo-router'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'

export default function CarletonWeitzMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Weitz</Stack.Title>
			<BonAppHostedMenu
				cafe="weitz"
				loadingMessage={['Observing the artwork…', 'Previewing performances…']}
				name="Weitz Center"
			/>
		</>
	)
}
