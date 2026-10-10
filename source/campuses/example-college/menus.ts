import type {MenusSection} from '../../features/menus/campus-section'

/** Wiki Monkeys' one café. */
export const menus: MenusSection = {
	tabs: [
		{
			name: 'treeline-commons',
			title: 'Treeline Commons',
			icon: 'fork.knife',
			bonApp: {cafe: 'treeline-commons', loadingMessage: ['Waxing the trays…']},
		},
	],
	entryHref: '/menus/treeline-commons',
}
