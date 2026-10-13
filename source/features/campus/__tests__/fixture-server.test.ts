import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {apiFetch, registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {reportMissingFixture} from '@frogpond/launch-arguments'
import {createStore} from 'zustand/vanilla'

import type {CampusId} from '../../../campuses'
import {
	fixtureCampusChanged,
	installCampusFixtures,
	installFixtureServer,
	MissingCampusFixture,
} from '../fixtures'

let campus = createStore<{campus: CampusId | null; hydrated: boolean}>(() => ({
	campus: 'example.college',
	hydrated: true,
}))
let uninstall: (() => void) | null = null
let network: jest.Mock<typeof fetch>

beforeEach(() => {
	network = jest.fn<typeof fetch>(() => Promise.resolve(new Response('{"live":true}')))
	global.fetch = network
	registerCampusServer('edu.stolaf', new URL('https://stolaf.frogpond.tech/v1/'))
	registerCampusServer('example.college', new URL('https://example.college.invalid/'))
	campus.setState({campus: 'example.college', hydrated: true})
})
afterEach(() => {
	uninstall?.()
	uninstall = null
	setFetchInterceptor(null)
})

describe('installFixtureServer', () => {
	test("answers Wiki Monkeys' requests from its fixtures, never the network", async () => {
		uninstall = installFixtureServer(campus)
		let response = await apiFetch('https://example.college.invalid/faqs')
		expect(response.status).toBe(200)
		expect(network).not.toHaveBeenCalled()
	})

	test("answers the platform manifest from Wiki Monkeys' own", async () => {
		uninstall = installFixtureServer(campus)
		let manifest = await (await apiFetch('https://stolaf.frogpond.tech/v1/sources')).json()
		expect(JSON.stringify(manifest)).toContain('valley-echo')
		expect(network).not.toHaveBeenCalled()
	})

	test('a request with no fixture rejects, naming the key', async () => {
		uninstall = installFixtureServer(campus)
		await expect(apiFetch('https://example.college.invalid/nowhere')).rejects.toThrow(
			MissingCampusFixture,
		)
		await expect(apiFetch('https://example.college.invalid/nowhere')).rejects.toThrow(
			'GET {server:example.college}/nowhere',
		)
	})

	test('a missing fixture is reported for the test runner, then rejects', async () => {
		jest.mocked(reportMissingFixture).mockClear()
		uninstall = installFixtureServer(campus)
		await expect(apiFetch('https://example.college.invalid/nowhere')).rejects.toThrow(
			MissingCampusFixture,
		)
		expect(reportMissingFixture).toHaveBeenCalledWith(
			'example.college',
			'GET {server:example.college}/nowhere',
		)
	})

	test('answers by the campus active at request time', async () => {
		uninstall = installFixtureServer(campus)
		campus.setState({campus: 'edu.stolaf'})
		await apiFetch('https://stolaf.frogpond.tech/v1/faqs')
		expect(network).toHaveBeenCalledTimes(1)
		campus.setState({campus: 'example.college'})
		await apiFetch('https://example.college.invalid/faqs')
		expect(network).toHaveBeenCalledTimes(1)
	})

	test("keeps answering after the campus's server is moved", async () => {
		uninstall = installFixtureServer(campus)
		registerCampusServer('example.college', new URL('http://localhost:3000/'))
		let response = await apiFetch('http://localhost:3000/faqs')
		expect(response.status).toBe(200)
		expect(network).not.toHaveBeenCalled()
	})
	test('leaves a campus with a server of its own to the network untouched', async () => {
		campus.setState({campus: 'edu.stolaf'})
		uninstall = installFixtureServer(campus)
		await apiFetch('https://stolaf.frogpond.tech/v1/faqs')
		// Straight to fetch, as it was given, not rewrapped by an interceptor.
		expect(network).toHaveBeenCalledWith('https://stolaf.frogpond.tech/v1/faqs', undefined)
	})

	test('a request made before the saved campus loads waits for it', async () => {
		campus.setState({campus: 'edu.stolaf', hydrated: false})
		uninstall = installFixtureServer(campus)
		let response = apiFetch('https://example.college.invalid/faqs')
		campus.setState({campus: 'example.college', hydrated: true})
		expect((await response).status).toBe(200)
		expect(network).not.toHaveBeenCalled()
	})

	// A developer pointing Wiki Monkeys at a local ccc-server St. Olaf also uses.
	test("keeps answering when the campus's server is moved to another campus's address", async () => {
		uninstall = installFixtureServer(campus)
		registerCampusServer('example.college', new URL('https://stolaf.frogpond.tech/v1/'))
		let response = await apiFetch('https://stolaf.frogpond.tech/v1/faqs')
		expect(response.status).toBe(200)
		let manifest = await (await apiFetch('https://stolaf.frogpond.tech/v1/sources')).json()
		expect(JSON.stringify(manifest)).toContain('valley-echo')
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
