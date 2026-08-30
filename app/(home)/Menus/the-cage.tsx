import * as React from 'react'
import {BonAppHostedMenu} from '../../../source/features/menus/menu-bonapp'

export default function TheCagePage(): React.ReactNode {
	return (
		<BonAppHostedMenu
			cafe="the-cage"
			ignoreProvidedMenus={true}
			loadingMessage={[
				'Checking for vegan cookies…',
				'Serving up some shakes…',
				'Waiting for menu screens to change…',
				'Frying chicken…',
				'Brewing coffee…',
			]}
			name="The Cage"
		/>
	)
}
