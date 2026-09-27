import * as React from 'react'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'
import {MenuHeaderHost, MenuHeaderProvider} from '../../source/features/menus/menu-header'

export default function CarletonSchulzeMenuPage(): React.ReactNode {
	return (
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<BonAppHostedMenu
				cafe="schulze"
				loadingMessage={['Pulling an espresso…', 'Scooping the ice cream…']}
				name="Schulze"
			/>
		</MenuHeaderProvider>
	)
}
