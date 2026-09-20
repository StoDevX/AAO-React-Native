import * as React from 'react'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'
import {MenuHeaderHost, MenuHeaderProvider} from '../../source/features/menus/menu-header'

export default function CarletonWeitzMenuPage(): React.ReactNode {
	return (
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<BonAppHostedMenu
				cafe="weitz"
				loadingMessage={['Observing the artwork…', 'Previewing performances…']}
				name="Weitz Center"
			/>
		</MenuHeaderProvider>
	)
}
