import type {OptionalSection} from '../features/campus/section-gate'

/**
 * Each feature's routes, by their path under app/, and the section a campus
 * needs for them. Routes bound to one campus by name (`/carleton-sumo`,
 * `/st-olaf-news`) are not here: they always show their own campus's. A
 * path under another's (`directory/named` under `directory`) is its own.
 */
export const ROUTE_SECTIONS: ReadonlyArray<readonly [path: string, section: OptionalSection]> = [
	['athletics', 'athletics'],
	['balances', 'balances'],
	['calendar', 'calendar'],
	['contacts', 'contacts'],
	['course-search', 'courseCatalog'],
	['customize/app-icon', 'appIcons'],
	['customize/quick-actions', 'quickActions'],
	['dictionary', 'dictionary'],
	// A contact's own page, which Contacts opens; the rest of /directory is the people directory.
	['directory/named', 'contacts'],
	['directory', 'directory'],
	['faq', 'faqs'],
	['hours', 'hours'],
	['map', 'map'],
	['menu-item-detail', 'menus'],
	['menus', 'menus'],
	['more', 'more'],
	['newspaper', 'paper'],
	['print-jobs', 'printing'],
	['radio', 'radio'],
	['streaming-media', 'streaming'],
	['student-orgs', 'studentOrgs'],
	['student-work', 'studentWork'],
	['support/notices', 'faqs'],
	['transit', 'transit'],
]

/** The section a route path (the most specific entry wins, as the list puts it first) (`/hours/detail/x`, `hours?campus=…`) needs, if any. */
export function sectionForRoute(route: string): OptionalSection | undefined {
	let path = route.replace(/^\//u, '').split('?')[0]
	return ROUTE_SECTIONS.find(([prefix]) => under(path, prefix))?.[1]
}

/** Whether `path` is `prefix` or a path beneath it. */
export function under(path: string, prefix: string): boolean {
	return path === prefix || path.startsWith(`${prefix}/`)
}
