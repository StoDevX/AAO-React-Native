import {afterEach, describe, expect, jest, test} from '@jest/globals'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {apiFetch, campusRoot, clientFor} from '@frogpond/api'

import {CAMPUSES} from '../../campuses'
import {useCampusStore} from '../../features/campus/store'
import * as storage from '../../lib/storage'
import {queryClient} from '../tanstack-query'
import {applySavedServers, registerDefaultServers} from '../api'

afterEach(async () => {
	await AsyncStorage.clear()
})

/** What a launch does: every default at once, then whatever was saved. */
async function launch(): Promise<void> {
	registerDefaultServers()
	await applySavedServers()
}

describe('the servers a launch points at', () => {
	test('are registered for every campus before storage answers', () => {
		registerDefaultServers()
		for (let campus of CAMPUSES) {
			expect(() => clientFor(campus.id)).not.toThrow()
			expect(campusRoot(campus.id)?.href).toBe(campus.api.defaultUrl)
		}
	})

	test("are each campus's default when nothing is saved", async () => {
		await launch()
		expect(campusRoot('edu.stolaf')?.href).toBe('https://stolaf.frogpond.tech/v1/')
		expect(campusRoot('edu.carleton')?.href).toBe('https://carleton.frogpond.tech/v1/')
	})

	test("apply St. Olaf's own saved server", async () => {
		await storage.setServerAddressFor(
			'settings:server-address:edu.stolaf',
			'https://dev.example.test/v1',
		)
		await launch()
		expect(campusRoot('edu.stolaf')?.href).toBe('https://dev.example.test/v1/')
	})

	test("apply Carleton's own saved server, with the slash added on save", async () => {
		await storage.setServerAddressFor(
			'settings:server-address:edu.carleton',
			'https://dev.example.test/v1',
		)
		await launch()
		expect(campusRoot('edu.carleton')?.href).toBe('https://dev.example.test/v1/')
		expect(campusRoot('edu.stolaf')?.href).toBe('https://stolaf.frogpond.tech/v1/')
	})
})

describe('Wiki Monkeys, which has no server', () => {
	afterEach(() => {
		useCampusStore.setState({campus: 'edu.stolaf'})
	})

	test('is answered from its fixtures while it is the campus', async () => {
		registerDefaultServers()
		useCampusStore.setState({campus: 'example.college'})
		let response = await apiFetch('https://example.college.invalid/faqs')
		expect(response.status).toBe(200)
	})

	test("drops what the other campus's servers answered when it is switched to or from", () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		let invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
		useCampusStore.setState({campus: 'example.college'})
		useCampusStore.setState({campus: 'edu.carleton'})
		useCampusStore.setState({campus: 'edu.stolaf'})
		expect(invalidate).toHaveBeenCalledTimes(2)
		invalidate.mockRestore()
	})
})
