import {afterEach, describe, expect, test} from '@jest/globals'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {useRecentPlacesStore} from '../store'

afterEach(async () => {
	useRecentPlacesStore.setState({recent: {}})
	await AsyncStorage.clear()
})

describe('recent places', () => {
	test('are kept per campus, by id', () => {
		let {remember} = useRecentPlacesStore.getState()
		remember('edu.carleton', 'boliou')
		remember('edu.stolaf', 'toh')
		expect(useRecentPlacesStore.getState().recent).toEqual({
			'edu.carleton': ['boliou'],
			'edu.stolaf': ['toh'],
		})
	})

	test('read as none for a campus with no key', () => {
		useRecentPlacesStore.getState().forget('edu.stolaf', 'toh')
		expect(useRecentPlacesStore.getState().recent['edu.stolaf']).toEqual([])
	})

	// Only 2.9's release candidates wrote the old keys; testers lose them once.
	test("drop a 2.9 release candidate's recents, keyed by the old ids", async () => {
		await AsyncStorage.setItem(
			'map-recent-places',
			JSON.stringify({state: {recent: {stolaf: ['toh'], carleton: ['boliou']}}, version: 1}),
		)
		await useRecentPlacesStore.persist.rehydrate()
		expect(useRecentPlacesStore.getState().recent).toEqual({})
	})
})
