import * as React from 'react'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'
import {MenuHeaderHost, MenuHeaderProvider} from '../../source/features/menus/menu-header'

export default function CarletonSaylesMenuPage(): React.ReactNode {
	return (
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<BonAppHostedMenu
				cafe="sayles"
				loadingMessage={['Engaging in people-watching…', 'Checking the mail…']}
				name="Sayles Hill"
			/>
		</MenuHeaderProvider>
	)
}
