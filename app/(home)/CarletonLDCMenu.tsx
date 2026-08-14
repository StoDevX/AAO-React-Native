import * as React from 'react'
import {Stack} from 'expo-router'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'

export default function CarletonLDCMenuPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>LDC</Stack.Title>
			<BonAppHostedMenu cafe="ldc" loadingMessage={['Tracking down empty seats…']} name="LDC" />
		</>
	)
}
