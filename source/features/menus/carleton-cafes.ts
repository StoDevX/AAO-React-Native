import type {SFSymbol} from 'sf-symbols-typescript'

/** One of Carleton's dining halls, as its own menu screen and as a tab of Carleton's Menus. */
export type CarletonCafe = {
	/** Bon Appétit's name for the café, which its menu is fetched by. */
	cafe: 'burton' | 'ldc' | 'weitz' | 'sayles' | 'schulze'
	/** The hall's name, as its menu is titled. */
	title: string
	/** The hall's screen of its own, which St. Olaf's Menus lists under its Carleton tab. */
	href:
		| '/carleton-burton-menu'
		| '/carleton-ldc-menu'
		| '/carleton-weitz-menu'
		| '/carleton-sayles-menu'
		| '/carleton-schulze-menu'
	/** The symbol on the hall's tab. */
	icon: SFSymbol
	/** What the menu says while it loads, one picked at random. */
	loadingMessage: string[]
}

/** Carleton's dining halls, in the order they are listed: the CARLS app's, then Schulze. */
export const CARLETON_CAFES: readonly CarletonCafe[] = [
	{
		cafe: 'burton',
		title: 'Burton',
		href: '/carleton-burton-menu',
		icon: 'fork.knife',
		loadingMessage: ['Searching for Schiller…'],
	},
	{
		cafe: 'ldc',
		title: 'LDC',
		href: '/carleton-ldc-menu',
		icon: 'fork.knife.circle.fill',
		loadingMessage: ['Tracking down empty seats…'],
	},
	{
		cafe: 'weitz',
		title: 'Weitz Center',
		href: '/carleton-weitz-menu',
		icon: 'paintpalette.fill',
		loadingMessage: ['Observing the artwork…', 'Previewing performances…'],
	},
	{
		cafe: 'sayles',
		title: 'Sayles Hill',
		href: '/carleton-sayles-menu',
		icon: 'storefront.fill',
		loadingMessage: ['Engaging in people-watching…', 'Checking the mail…'],
	},
	{
		cafe: 'schulze',
		title: 'Schulze',
		href: '/carleton-schulze-menu',
		icon: 'mug.fill',
		loadingMessage: ['Pulling an espresso…', 'Scooping the ice cream…'],
	},
]

/** The hall Bon Appétit names `cafe`. */
export function carletonCafe(cafe: CarletonCafe['cafe']): CarletonCafe {
	let found = CARLETON_CAFES.find((entry) => entry.cafe === cafe)
	if (!found) throw new Error(`no Carleton café named ${cafe}`)
	return found
}
