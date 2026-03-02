import React from 'react'
import {BonAppHostedMenu} from '../../views/menus/menu-bonapp'

export default function StavHallMenuTab(): React.ReactNode {
	return (
		<BonAppHostedMenu
			cafe="stav-hall"
			loadingMessage={[
				'Hunting Ferndale Turkey…',
				'Tracking wild vegan burgers…',
				'"Cooking" some lutefisk…',
				'Finding more mugs…',
				'Waiting for omelets…',
				'Putting out more cookies…',
			]}
			name="Stav Hall"
		/>
	)
}
