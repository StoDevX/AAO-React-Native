import * as React from 'react'
import {Stack} from 'expo-router'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'

export default function CarletonBurtonMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Burton</Stack.Title>
			<BonAppHostedMenu
				cafe="burton"
				loadingMessage={['Searching for Schiller…']}
				name="Burton"
			/>
		</>
	)
}
