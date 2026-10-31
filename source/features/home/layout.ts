import type {HomeLayout} from './store'

/** Home's layouts, and what Customize's Layout menu calls each. */
const LAYOUTS = [
	['tiled', 'Tiled'],
	['list', 'List'],
	['phone', 'Phone'],
] as const satisfies ReadonlyArray<readonly [HomeLayout, string]>

/** The layouts only dev mode offers: the Phone layout's hotline is still being tried out. */
const DEV_ONLY: ReadonlySet<HomeLayout> = new Set(['phone'])

/** The layouts Customize offers, with their names, given whether dev mode is on. */
export function homeLayoutsOffered(isDev: boolean): ReadonlyArray<readonly [HomeLayout, string]> {
	return LAYOUTS.filter(([layout]) => isDev || !DEV_ONLY.has(layout))
}

/**
 * The layout home draws for the saved `layout`: a dev-only one, saved while dev
 * mode was on, draws as tiles once it is off, and comes back when it is on again.
 */
export function homeLayoutShown(layout: HomeLayout, isDev: boolean): HomeLayout {
	return isDev || !DEV_ONLY.has(layout) ? layout : 'tiled'
}
