import * as React from 'react'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'
import {MenuHeaderHost, MenuHeaderProvider} from '../../source/features/menus/menu-header'

export default function CarletonLDCMenuPage(): React.ReactNode {
	return (
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<BonAppHostedMenu cafe="ldc" loadingMessage={['Tracking down empty seats…']} name="LDC" />
		</MenuHeaderProvider>
	)
}
