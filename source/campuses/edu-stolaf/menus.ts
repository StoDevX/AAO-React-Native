import * as c from '@frogpond/colors'

import type {MenusSection} from '../../features/menus/campus-section'

/** St. Olaf's cafés. Stav Hall, first, is where Menus opens. */
export const menus: MenusSection = {
	tabs: [
		{
			name: 'stav-hall',
			title: 'Stav Hall',
			icon: 'fork.knife',
			bonApp: {
				cafe: 'stav-hall',
				loadingMessage: [
					'Hunting Ferndale Turkey…',
					'Tracking wild vegan burgers…',
					'"Cooking" some lutefisk…',
					'Finding more mugs…',
					'Waiting for omelets…',
					'Putting out more cookies…',
				],
			},
		},
		{
			name: 'the-cage',
			title: 'The Cage',
			icon: 'cup.and.saucer.fill',
			bonApp: {
				cafe: 'the-cage',
				ignoreProvidedMenus: true,
				loadingMessage: [
					'Checking for vegan cookies…',
					'Serving up some shakes…',
					'Waiting for menu screens to change…',
					'Frying chicken…',
					'Brewing coffee…',
				],
			},
		},
		{name: 'the-pause', title: 'The Pause', icon: 'pawprint.fill'},
	],
	quickActions: [
		{
			type: 'view',
			view: '/menus/stav-hall',
			title: 'Stav Menu',
			icon: 'fork.knife',
			gradient: c.greenGradient,
		},
		{
			type: 'view',
			view: '/menus/the-cage',
			title: 'Cage Menu',
			icon: 'cup.and.saucer.fill',
			gradient: c.greenGradient,
		},
	],
}
