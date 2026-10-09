import {afterEach, describe, expect, test} from '@jest/globals'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {campusRoot, clientFor} from '@frogpond/api'

import {CAMPUSES} from '../../campuses'
import * as storage from '../../lib/storage'
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
