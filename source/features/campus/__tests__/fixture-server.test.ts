import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {apiFetch, registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {reportMissingFixture} from '@frogpond/launch-arguments'

import type {CampusId} from '../../../campuses'
import {
	fixtureCampusChanged,
	installCampusFixtures,
	installFixtureServer,
	MissingCampusFixture,
} from '../fixtures'

let active: CampusId | null = 'example.college'
let network: jest.Mock<typeof fetch>

beforeEach(() => {
	network = jest.fn<typeof fetch>(() => Promise.resolve(new Response('{"live":true}')))
	global.fetch = network
	registerCampusServer('edu.stolaf', new URL('https://stolaf.frogpond.tech/v1/'))
	registerCampusServer('example.college', new URL('https://example.college.invalid/'))
	active = 'example.college'
})
afterEach(() => setFetchInterceptor(null))

describe('installFixtureServer', () => {
	test("answers Wiki Monkeys' requests from its fixtures, never the network", async () => {
		installFixtureServer(() => active)
		let response = await apiFetch('https://example.college.invalid/faqs')
		expect(response.status).toBe(200)
		expect(network).not.toHaveBeenCalled()
	})

	test("answers the platform manifest from Wiki Monkeys' own", async () => {
		installFixtureServer(() => active)
		let manifest = await (await apiFetch('https://stolaf.frogpond.tech/v1/sources')).json()
		expect(JSON.stringify(manifest)).toContain('valley-echo')
		expect(network).not.toHaveBeenCalled()
	})

	test('a request with no fixture rejects, naming the key', async () => {
		installFixtureServer(() => active)
		await expect(apiFetch('https://example.college.invalid/nowhere')).rejects.toThrow(
			MissingCampusFixture,
		)
		await expect(apiFetch('https://example.college.invalid/nowhere')).rejects.toThrow(
			'GET {server:example.college}/nowhere',
		)
	})

	test('a missing fixture is reported for the test runner, then rejects', async () => {
		jest.mocked(reportMissingFixture).mockClear()
		installFixtureServer(() => active)
		await expect(apiFetch('https://example.college.invalid/nowhere')).rejects.toThrow(
			MissingCampusFixture,
		)
		expect(reportMissingFixture).toHaveBeenCalledWith(
			'example.college',
			'GET {server:example.college}/nowhere',
		)
	})

	test('answers by the campus active at request time', async () => {
		installFixtureServer(() => active)
		active = 'edu.stolaf'
		await apiFetch('https://stolaf.frogpond.tech/v1/faqs')
		expect(network).toHaveBeenCalledTimes(1)
		active = 'example.college'
		await apiFetch('https://example.college.invalid/faqs')
		expect(network).toHaveBeenCalledTimes(1)
	})

	test("keeps answering after the campus's server is moved", async () => {
		installFixtureServer(() => active)
		registerCampusServer('example.college', new URL('http://localhost:3000/'))
		let response = await apiFetch('http://localhost:3000/faqs')
		expect(response.status).toBe(200)
		expect(network).not.toHaveBeenCalled()
	})
})

describe('fixtureCampusChanged', () => {
	test('switching to or from a fixture campus invalidates queries', () => {
		expect(fixtureCampusChanged('edu.stolaf', 'example.college')).toBe(true)
		expect(fixtureCampusChanged('example.college', 'edu.carleton')).toBe(true)
		expect(fixtureCampusChanged('edu.stolaf', 'edu.carleton')).toBe(false)
		expect(fixtureCampusChanged(null, 'edu.stolaf')).toBe(false)
	})
})

describe('installCampusFixtures', () => {
	test("serves Wiki Monkeys' fixtures even when asked to record", async () => {
		installCampusFixtures('example.college', 'record')
		await apiFetch('https://example.college.invalid/faqs')
		expect(network).not.toHaveBeenCalled()
	})
})
