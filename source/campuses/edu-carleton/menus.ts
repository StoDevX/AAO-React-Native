import type {MenusSection} from '../../features/menus/campus-section'

/** Carleton's dining halls, in the order Menus' tab bar lists them, from Carleton's own server. */
export const menus: MenusSection = {
	tabs: [
		{
			name: 'burton',
			title: 'Burton',
			icon: 'fork.knife',
			bonApp: {cafe: 'burton', loadingMessage: ['Searching for Schiller…']},
		},
		{
			name: 'ldc',
			title: 'LDC',
			icon: 'fork.knife.circle.fill',
			bonApp: {cafe: 'ldc', loadingMessage: ['Tracking down empty seats…']},
		},
		{
			name: 'sayles',
			title: 'Sayles Hill',
			icon: 'storefront.fill',
			bonApp: {
				cafe: 'sayles',
				loadingMessage: ['Engaging in people-watching…', 'Checking the mail…'],
			},
		},
		{
			name: 'weitz',
			title: 'Weitz',
			icon: 'paintpalette.fill',
			bonApp: {
				cafe: 'weitz',
				loadingMessage: ['Observing the artwork…', 'Previewing performances…'],
			},
		},
		{
			name: 'schulze',
			title: 'Schulze',
			icon: 'mug.fill',
			bonApp: {
				cafe: 'schulze',
				loadingMessage: ['Pulling an espresso…', 'Scooping the ice cream…'],
			},
		},
	],
}
