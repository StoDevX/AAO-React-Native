import React from 'react'
import {BonAppHostedMenu} from '../../views/menus/menu-bonapp'

export default function TheCageMenuTab(): React.ReactNode {
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
