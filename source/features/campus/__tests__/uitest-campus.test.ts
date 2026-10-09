import {describe, expect, jest, test} from '@jest/globals'

// A UI test that named Carleton: what the native module reports for it.
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: true,
	campusFixturesDomain: 'carleton.edu',
	servesBundledFixtures: false,
}))

import AsyncStorage from '@react-native-async-storage/async-storage'

import {useCampusStore} from '../store'

describe('a UI test that names a campus', () => {
	test('starts on that campus', () => {
		expect(useCampusStore.getState().campus).toBe('carleton')
	})

	test('ignores a campus an earlier test saved', async () => {
		await AsyncStorage.setItem('campus', JSON.stringify({state: {campus: 'stolaf'}, version: 1}))
		await useCampusStore.persist.rehydrate()
		expect(useCampusStore.getState().campus).toBe('carleton')
	})
})
