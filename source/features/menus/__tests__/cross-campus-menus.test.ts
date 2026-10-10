import {existsSync, readFileSync, readdirSync} from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {CAMPUSES, campusById, type CampusId} from '../../../campuses'
import {tableFrom} from '../../campus/fixtures'
import carletonFixtures from '../../campus/__fixtures__/edu.carleton'
import stolafFixtures from '../../campus/__fixtures__/edu.stolaf'
import {cafeTabsOf, menuServerOf} from '../menu-tabs'

/** Each campus's recorded requests, which its UI tests are served from. */
const RECORDINGS: Partial<Record<CampusId, ReadonlyArray<string>>> = {
	'edu.carleton': Object.keys(tableFrom('edu.carleton', carletonFixtures)),
	'edu.stolaf': Object.keys(tableFrom('edu.stolaf', stolafFixtures)),
}

const APP = path.join(__dirname, '../../../../app')

/**
 * Each campus's view of another's cafés: its `menus-*` folder under the
 * campus's folder in app/, and the campus its layout's `CafeTabs` shows.
 */
const CROSS_CAMPUS = CAMPUSES.flatMap((campus) => {
	let dir = path.join(APP, campus.id)
	if (!existsSync(dir)) {
		return []
	}
	return readdirSync(dir, {withFileTypes: true})
		.filter((entry) => entry.isDirectory() && entry.name.startsWith('menus-'))
		.map((entry) => {
			let layout = readFileSync(path.join(dir, entry.name, '_layout.tsx'), 'utf8')
			let shows = /<CafeTabs campus="([^"]+)"/u.exec(layout)?.[1] as CampusId
			return [`${campus.id}/${entry.name}`, shows] as const
		})
})

test("finds each campus's view of the other", () => {
	expect(CROSS_CAMPUS).toEqual([
		['edu.stolaf/menus-carleton', 'edu.carleton'],
		['edu.carleton/menus-stolaf', 'edu.stolaf'],
	])
})

describe.each(CROSS_CAMPUS)('%s', (folder, shows) => {
	test(`has one file per café of ${shows}, and no other`, () => {
		let files = readdirSync(path.join(APP, folder))
			.filter((file) => file.endsWith('.tsx') && file !== '_layout.tsx' && file !== 'index.tsx')
			.map((file) => file.replace(/\.tsx$/u, ''))
		expect(files.toSorted()).toEqual(
			cafeTabsOf(shows)
				.map((tab) => tab.name)
				.toSorted(),
		)
	})

	// The tab bar opens on the first café, so a UI test on the viewing campus
	// fetches it, and strict mode fails a request its recordings cannot answer.
	test("is answered by the viewing campus's recordings when it opens", () => {
		let viewing = folder.split('/')[0] as CampusId
		let server = menuServerOf(campusById(shows))
		let first = cafeTabsOf(shows)[0].name
		expect(RECORDINGS[viewing]).toEqual(
			expect.arrayContaining([
				`GET {server:${server}}/food/named/cafe/${first}`,
				`GET {server:${server}}/food/named/menu/${first}`,
			]),
		)
	})
})
