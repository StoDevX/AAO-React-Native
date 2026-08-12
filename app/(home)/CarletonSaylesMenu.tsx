import * as React from 'react'
import {Stack} from 'expo-router'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'

export default function CarletonSaylesMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Sayles</Stack.Title>
			<BonAppHostedMenu
				cafe="sayles"
				loadingMessage={['Engaging in people-watching…', 'Checking the mail…']}
				name="Sayles Hill"
			/>
		</>
	)
}
