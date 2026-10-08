import type {SFSymbol} from 'sf-symbols-typescript'

/** One of Carleton's dining halls, as a tab of Menus. */
export type CarletonCafe = {
	/** Bon Appétit's name for the café, which its menu is fetched by. */
	cafe: 'burton' | 'ldc' | 'weitz' | 'sayles' | 'schulze'
	/** The hall's name, as its menu is titled. */
	title: string
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
		icon: 'fork.knife',
		loadingMessage: ['Searching for Schiller…'],
	},
	{
		cafe: 'ldc',
		title: 'LDC',
		icon: 'fork.knife.circle.fill',
		loadingMessage: ['Tracking down empty seats…'],
	},
	{
		cafe: 'weitz',
		title: 'Weitz Center',
		icon: 'paintpalette.fill',
		loadingMessage: ['Observing the artwork…', 'Previewing performances…'],
	},
	{
		cafe: 'sayles',
		title: 'Sayles Hill',
		icon: 'storefront.fill',
		loadingMessage: ['Engaging in people-watching…', 'Checking the mail…'],
	},
	{
		cafe: 'schulze',
		title: 'Schulze',
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
