import {readdirSync, readFileSync, statSync} from 'node:fs'
import {join, relative} from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {ROUTE_SECTIONS, sectionForRoute} from '../../../testing/route-sections'

const APP = join(__dirname, '../../../../app')

/**
 * Every screen at or under `path` in app/, as paths relative to app/. A
 * layout draws only its screens, so it is checked through them.
 */
function routeFiles(path: string): string[] {
	let full = join(APP, path)
	let file = `${full}.tsx`
	try {
		if (statSync(file).isFile()) return [relative(APP, file)]
	} catch {}
	return readdirSync(full, {recursive: true, encoding: 'utf8'})
		.filter((name) => name.endsWith('.tsx') && !name.includes('__tests__'))
		.filter((name) => !name.endsWith('_layout.tsx'))
		.map((name) => relative(APP, join(full, name)))
}

/** Wrappers that gate a screen on a section through `requiresSection`, by the section. */
const GATING_WRAPPERS: Readonly<Record<string, string>> = {paper: 'newspaperRoute'}

/** Whether `file`'s default export is gated on `section`. */
function gates(file: string, section: string): boolean {
	let source = readFileSync(join(APP, file), 'utf8')
	let wrapper = GATING_WRAPPERS[section]
	return (
		new RegExp(`^export default requiresSection\\(\\s*'${section}',`, 'mu').test(source) ||
		(wrapper !== undefined && new RegExp(`^export default ${wrapper}\\(`, 'mu').test(source))
	)
}

/** Whether `file`, or a layout between it and its feature's root, is gated on `section`. */
function gatedWithin(root: string, file: string, section: string): boolean {
	if (gates(file, section)) return true
	let dir = file.split('/').slice(0, -1)
	let depth = root.split('/').length
	while (dir.length >= depth) {
		let layout = [...dir, '_layout.tsx'].join('/')
		try {
			if (gates(layout, section)) return true
		} catch {}
		dir.pop()
	}
	return false
}

describe.each(ROUTE_SECTIONS)('every /%s route', (root, section) => {
	let own = routeFiles(root).filter(
		(file) => sectionForRoute(file.replace(/\.tsx$/u, '')) === section,
	)
	test.each(own)(`%s says so on a campus without ${section}`, (file) => {
		expect(gatedWithin(root, file, section)).toBe(true)
	})
})
