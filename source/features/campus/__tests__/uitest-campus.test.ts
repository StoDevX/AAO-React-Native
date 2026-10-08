import {describe, expect, jest, test} from '@jest/globals'

// A UI test that named Carleton: what the native module reports for it.
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: true,
	campusFixturesDomain: 'carleton.edu',
	servesBundledFixtures: false,
}))

import {useCampusStore} from '../store'

describe('a UI test that names a campus', () => {
	test('starts on that campus', () => {
		expect(useCampusStore.getState().campus).toBe('carleton')
	})

	test('ignores a campus an earlier test saved', async () => {
		await useCampusStore.persist.rehydrate()
		expect(useCampusStore.getState().campus).toBe('carleton')
	})
})
