import {readdirSync} from 'node:fs'
import {join, relative, sep} from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {CAMPUSES} from '..'
import {viewTarget} from '../../features/views'

const APP = join(__dirname, '../../../app')

/** Every file under `dir`, relative to `app/`. */
function filesUnder(dir: string): string[] {
	return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
		let path = join(dir, entry.name)
		return entry.isDirectory() ? filesUnder(path) : [relative(APP, path)]
	})
}

/**
 * A screen file's route, as segments: the extension, `(group)` folders and a
 * trailing `index` dropped. Null for a layout, a `+` file or anything not a
 * screen.
 */
function routeOf(file: string): string[] | null {
	if (!/\.tsx?$/u.test(file)) {
		return null
	}
	let segments = file.replace(/\.tsx?$/u, '').split(sep)
	let last = segments.at(-1) ?? ''
	if (last.startsWith('_') || last.startsWith('+')) {
		return null
	}
	return segments.filter((segment) => !/^\(.+\)$/u.test(segment) && segment !== 'index')
}

const ROUTES = filesUnder(APP)
	.map(routeOf)
	.filter((route): route is string[] => route !== null)

/** Whether `route` serves `path`: literals match exactly, `[x]` any one segment, `[...x]` the rest. */
function serves(route: string[], path: string[]): boolean {
	let [head, ...rest] = route
	if (head === undefined) {
		return path.length === 0
	}
	if (/^\[\.\.\..+\]$/u.test(head)) {
		return path.length > 0
	}
	if (path.length === 0) {
		return false
	}
	return (/^\[.+\]$/u.test(head) || head === path[0]) && serves(rest, path.slice(1))
}

/** Whether some screen under `app/` serves `href`'s path, ignoring its query. */
function routeExists(href: string): boolean {
	let path = new URL(href, 'app://route').pathname.split('/').filter(Boolean)
	return ROUTES.some((route) => serves(route, path))
}

describe('the route table', () => {
	test.each([
		'/',
		'/menus',
		'/menus/burton',
		'/map?campus=edu.carleton',
		'/directory/named/PubSafe',
		'/developer/debug/a/b',
	])('serves %s', (href) => {
		expect(routeExists(href)).toBe(true)
	})

	test.each(['/no-such-screen', '/menus/burton/extra', '/_layout'])('does not serve %s', (href) => {
		expect(routeExists(href)).toBe(false)
	})
})

// Named by where each tile goes as well as its title: St. Olaf has two
// Balances tiles, the web page and the disabled native screen, and two tests
// of the same name read as one test to the flakiness tracker.
const TILES = CAMPUSES.flatMap((campus) =>
	campus.home.tiles.map((tile) => [campus.id, tile.title, viewTarget(tile), tile] as const),
)

describe.each(TILES)('%s’s %s tile, to %s', (_campus, _title, _target, tile) => {
	test('opens a screen that exists, or a secure web page, or a station', () => {
		if (tile.type === 'view') {
			expect(routeExists(viewTarget(tile))).toBe(true)
		} else if (tile.type === 'radio') {
			expect(tile.station).not.toBe('')
		} else {
			expect(new URL(tile.url).protocol).toBe('https:')
		}
	})

	test('names its campus by reverse-DNS id in a `?campus=` link', () => {
		let campusParam = new URL(viewTarget(tile), 'app://route').searchParams.get('campus')
		if (campusParam !== null) {
			expect(CAMPUSES.map((campus) => campus.id)).toContain(campusParam)
		}
	})
})
