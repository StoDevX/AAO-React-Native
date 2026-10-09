import {describe, expect, test} from '@jest/globals'

import {CAMPUSES, campusById} from '..'

const stolafAbout = campusById('edu.stolaf').about

describe("St. Olaf's credits", () => {
	let names = (id: string) => stolafAbout?.credits.find((credit) => credit.id === id)?.names ?? []

	test('name nobody twice', () => {
		let all = [...names('contributors'), ...names('acknowledgements')]
		expect(new Set(all).size).toBe(all.length)
	})

	test('keep each list in alphabetical order', () => {
		expect(names('contributors')).toEqual([...names('contributors')].sort())
		expect(names('acknowledgements')).toEqual([...names('acknowledgements')].sort())
	})
})

describe("St. Olaf's story", () => {
	test('starts with the current version of the app', () => {
		expect(stolafAbout?.story[0]?.period).toMatch(/Today/u)
	})

	test('gives every era a heading and a story', () => {
		for (let era of stolafAbout?.story ?? []) {
			expect(era.period).not.toBe('')
			expect(era.story).not.toBe('')
		}
	})
})

describe.each(CAMPUSES)("$id's data sources", (campus) => {
	let dataSources = campus.about?.dataSources ?? []

	test('are listed', () => {
		expect(dataSources.length).toBeGreaterThan(0)
	})

	test('name each source once', () => {
		let names = dataSources.map((entry) => entry.name)
		expect(new Set(names).size).toBe(names.length)
	})

	test('say what each source provides', () => {
		for (let entry of dataSources) {
			expect(entry.provides).not.toBe('')
		}
	})

	test('link each source to a secure page', () => {
		for (let entry of dataSources) {
			expect(new URL(entry.url).protocol).toBe('https:')
		}
	})
})
