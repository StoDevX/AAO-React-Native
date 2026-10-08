import type {SFSymbol} from 'sf-symbols-typescript'

import type {Campus} from '../campus/store'
import {CARLETON_CAFES} from './carleton-cafes'

/** A tab of Menus: a café, the campus it is on, and the route file it opens. */
export type MenuTab = {
	/** The tab's route under `app/menus/`; St. Olaf's Stav Hall is the index. */
	name: string
	campus: Campus
	title: string
	icon: SFSymbol
}

/** Every café Menus can show, St. Olaf's first. The tab bar shows one campus's at a time. */
export const MENU_TABS: readonly MenuTab[] = [
	{name: 'index', campus: 'stolaf', title: 'Stav Hall', icon: 'fork.knife'},
	{name: 'the-cage', campus: 'stolaf', title: 'The Cage', icon: 'cup.and.saucer.fill'},
	{name: 'the-pause', campus: 'stolaf', title: 'The Pause', icon: 'pawprint.fill'},
	...CARLETON_CAFES.map((hall): MenuTab => ({
		name: hall.cafe,
		campus: 'carleton',
		title: hall.title,
		icon: hall.icon,
	})),
]

/** Where each campus's cafés open: its first tab. */
export const CAMPUS_MENU_HREF = {
	stolaf: '/menus',
	carleton: '/menus/burton',
} as const satisfies Record<Campus, string>

/**
 * The campus whose cafés the tab bar shows, from the path Menus is on: a
 * Carleton hall's tab shows Carleton's, and anything else St. Olaf's.
 */
export function menuCampusOf(pathname: string): Campus {
	let name = pathname.replace(/\/+$/u, '').split('/').at(-1)
	let tab = MENU_TABS.find((candidate) => candidate.name === name)
	return tab?.campus ?? 'stolaf'
}
