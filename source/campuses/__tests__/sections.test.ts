import {describe, expect, test} from '@jest/globals'

import {CAMPUSES, campusById} from '..'

describe.each(CAMPUSES)('$id', (campus) => {
	test('names its app, its college and where support email goes', () => {
		expect(campus.branding.appName).not.toBe('')
		expect(campus.branding.college).not.toBe('')
		expect(campus.branding.supportEmail).toMatch(/^[^@\s]+@[^@\s]+$/u)
	})

	test('has notices for the foot of Home', () => {
		expect(campus.branding.notices.length).toBeGreaterThan(0)
	})

	test('ends its Home on the Developer tile, in dev mode only', () => {
		expect(campus.home.tiles.at(-1)).toMatchObject({title: 'Developer', devOnly: true})
	})
})

describe('St. Olaf', () => {
	let stolaf = campusById('edu.stolaf')

	test('is All About Olaf, with its own notices', () => {
		expect(stolaf.branding).toMatchObject({
			appName: 'All About Olaf',
			supportEmail: 'allaboutolaf@frogpond.tech',
			college: 'St. Olaf College',
		})
		expect(stolaf.branding.notices).toContain('An unofficial St. Olaf app')
	})

	test('calls PubSafe and SARN ahead of 911, and offers no helpdesk', () => {
		expect(stolaf.support?.emergency).toEqual([
			{label: 'PubSafe', contact: 'PubSafe'},
			{label: 'SARN', contact: 'SARN'},
		])
		expect(stolaf.support?.helpdesk).toBeUndefined()
	})

	test('titles its contacts as its tile does', () => {
		expect(stolaf.contacts?.title).toBe('Contacts')
	})
})

describe('Carleton', () => {
	let carleton = campusById('edu.carleton')

	test("is CARLS, with CARLS' intro and notices", () => {
		expect(carleton.branding).toMatchObject({
			appName: 'CARLS',
			supportEmail: 'carls@frogpond.tech',
			college: 'Carleton College',
		})
		expect(carleton.branding.intro).toMatch(/^CARLS is an application created by Hawken Rives/u)
		expect(carleton.branding.notices).toContain('An unofficial Carleton app')
	})

	test("calls Security ahead of 911, and offers ITS's helpdesk", () => {
		expect(carleton.support?.emergency).toEqual([{label: 'Security', contact: 'Security Services'}])
		expect(carleton.support?.helpdesk).toMatchObject({name: 'ITS', phoneNumber: '5072225999'})
	})

	test('titles its contacts as its tile does', () => {
		expect(carleton.contacts?.title).toBe('Important Contacts')
	})
})
