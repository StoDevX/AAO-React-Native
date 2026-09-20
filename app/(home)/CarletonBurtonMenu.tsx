import * as React from 'react'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'
import {MenuHeaderHost, MenuHeaderProvider} from '../../source/features/menus/menu-header'

export default function CarletonBurtonMenuPage(): React.ReactNode {
	return (
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<BonAppHostedMenu cafe="burton" loadingMessage={['Searching for Schiller…']} name="Burton" />
		</MenuHeaderProvider>
	)
}
