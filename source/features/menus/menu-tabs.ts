import {CAMPUSES, type CampusDefinition, type CampusId} from '../../campuses'
import {sectionServer} from '../campus/section-server'
import type {MenuTab} from './campus-section'

/** Every campus's tabs, in registry order, each with the campus that lists it. */
export const MENU_TABS: ReadonlyArray<{campus: CampusId; tab: MenuTab}> = CAMPUSES.flatMap(
	(campus) => (campus.menus?.tabs ?? []).map((tab) => ({campus: campus.id, tab})),
)

/** The tab a path under Menus opens: `/menus` is the index tab, `/menus/burton` Burton's. */
export function menuTabName(pathname: string): string {
	let last = pathname.replace(/\/+$/u, '').split('/').at(-1) ?? ''
	return last === 'menus' ? 'index' : last
}

function ownerOf(name: string): CampusDefinition | undefined {
	return CAMPUSES.find((campus) => campus.menus?.tabs.some((tab) => tab.name === name))
}

/**
 * The campus whose cafés the tab bar shows on `pathname`: the one listing the
 * open tab, so a café reached by URL shows its own campus's tabs. A path that
 * is no café's, such as a sheet over Menus, shows `current`'s.
 */
export function menuCampusOf(pathname: string, current: CampusId): CampusId {
	return ownerOf(menuTabName(pathname))?.id ?? current
}

/** The campus whose server answers for `campus`'s cafés. */
export function menuServerOf(campus: CampusDefinition): CampusId {
	return sectionServer(campus.id, campus.menus)
}

/**
 * The tab named `name` as its route file draws it: the tab, the campus listing
 * it, and that campus's menus server. A route file names its own tab, since
 * the global pathname is a sheet's while one is open.
 */
export function menuTab(name: string): {campus: CampusId; server: CampusId; tab: MenuTab} {
	let campus = ownerOf(name)
	let tab = campus?.menus?.tabs.find((candidate) => candidate.name === name)
	if (!campus || !tab) {
		throw new Error(`No campus's Menus lists a tab named ${name}`)
	}
	return {campus: campus.id, server: menuServerOf(campus), tab}
}
