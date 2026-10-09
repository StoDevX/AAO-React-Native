import {describe, expect, jest, test} from '@jest/globals'

type Setup = {defaultCampus: string | null; uiTestCampus: string | null}

/**
 * The campus store as a build with `setup` would load it. resetModules gives
 * the store a fresh AsyncStorage too, so a saved campus goes into that one.
 */
async function loadStoreWithSaved(setup: Setup, campus: string) {
	jest.resetModules()
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	let AsyncStorage = require('@react-native-async-storage/async-storage')
		.default as typeof import('@react-native-async-storage/async-storage').default
	await AsyncStorage.setItem('campus', JSON.stringify({state: {campus}, version: 1}))
	let store = loadStore(setup, {reset: false})
	await store.useCampusStore.persist.rehydrate()
	return store
}

/** The campus store as a build with `setup` would load it. */
function loadStore({defaultCampus, uiTestCampus}: Setup, {reset = true} = {}) {
	if (reset) {
		jest.resetModules()
	}
	jest.doMock('../../../lib/app-identity', () => ({APP: 'aao', DEFAULT_CAMPUS: defaultCampus}))
	jest.doMock('@frogpond/launch-arguments', () => ({
		isUITesting: uiTestCampus !== null,
		uiTestCampus,
		servesBundledFixtures: false,
	}))
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require('../store') as typeof import('../store')
}

describe('the campus a launch opens on', () => {
	test("is the variant's default on a fresh install", () => {
		let {useCampusStore} = loadStore({defaultCampus: 'edu.carleton', uiTestCampus: null})
		expect(useCampusStore.getState().campus).toBe('edu.carleton')
	})

	test('is the saved campus over the default', async () => {
		let {useCampusStore} = await loadStoreWithSaved(
			{defaultCampus: 'edu.stolaf', uiTestCampus: null},
			'edu.carleton',
		)
		expect(useCampusStore.getState().campus).toBe('edu.carleton')
	})

	test('ignores a legacy saved id and opens on the default', async () => {
		let {useCampusStore} = await loadStoreWithSaved(
			{defaultCampus: 'edu.stolaf', uiTestCampus: null},
			'carleton',
		)
		expect(useCampusStore.getState().campus).toBe('edu.stolaf')
	})

	test('is the UI test campus over a saved one', async () => {
		let {useCampusStore} = await loadStoreWithSaved(
			{defaultCampus: 'edu.stolaf', uiTestCampus: 'edu.carleton'},
			'edu.stolaf',
		)
		expect(useCampusStore.getState().campus).toBe('edu.carleton')
	})

	test('throws on an unknown UI-test campus, naming the known ones', () => {
		expect(() => loadStore({defaultCampus: 'edu.stolaf', uiTestCampus: 'carleton.edu'})).toThrow(
			'--campus names carleton.edu, but the campuses are edu.stolaf, edu.carleton',
		)
	})

	test('throws on an unknown variant default', () => {
		expect(() => loadStore({defaultCampus: 'edu.nowhere', uiTestCampus: null})).toThrow(
			"app.config.ts's defaultCampus names edu.nowhere",
		)
	})

	test('is none, so the picker shows, for a build without a default', async () => {
		let {useCampusStore} = loadStore({defaultCampus: null, uiTestCampus: null})
		await useCampusStore.persist.rehydrate()
		expect(useCampusStore.getState().campus).toBeNull()
	})
})

describe('switching campus', () => {
	test('works in every build, CARLS included', () => {
		let {useCampusStore} = loadStore({defaultCampus: 'edu.carleton', uiTestCampus: null})
		useCampusStore.getState().setCampus('edu.stolaf')
		expect(useCampusStore.getState().campus).toBe('edu.stolaf')
	})
})

describe('the legacy bridge', () => {
	test('maps ids to the ids features still compare against', () => {
		let {legacyCampusOf} = loadStore({defaultCampus: 'edu.stolaf', uiTestCampus: null})
		expect(legacyCampusOf('edu.stolaf')).toBe('stolaf')
		expect(legacyCampusOf('edu.carleton')).toBe('carleton')
	})
})
