import type * as StoreModule from '../store'

// The store persists through expo-sqlite's key-value store, which needs a
// native module Jest does not have. A Map behaves the same for these tests,
// synchronous reads included.
const mockItems = new Map<string, string>()
jest.mock('expo-sqlite/kv-store', () => ({
	Storage: {
		getItemSync: (key: string) => mockItems.get(key) ?? null,
		setItemSync: (key: string, value: string) => {
			mockItems.set(key, value)
		},
		removeItemSync: (key: string) => mockItems.delete(key),
	},
}))

let mockNextId = 0
jest.mock('expo-crypto', () => ({
	randomUUID: () => {
		mockNextId += 1
		return `id-${mockNextId}`
	},
}))

/** A fresh copy of the store module, as on a new launch of the app. */
function launch(): typeof StoreModule.useTelemetryStore {
	let loaded: typeof StoreModule | undefined
	jest.isolateModules(() => {
		// oxlint-disable-next-line typescript/no-require-imports
		loaded = require('../store') as typeof StoreModule
	})
	if (!loaded) throw new Error('store did not load')
	return loaded.useTelemetryStore
}

beforeEach(() => {
	mockItems.clear()
	mockNextId = 0
})

describe('the telemetry consent store', () => {
	it('shares by default, with no ID until one is asked for', () => {
		let store = launch()

		expect(store.getState().enabled).toBe(true)
		expect(store.getState().deviceId).toBeNull()
	})

	it('makes an ID on first ask and keeps it', () => {
		let store = launch()

		expect(store.getState().ensureDeviceId()).toBe('id-1')
		expect(store.getState().ensureDeviceId()).toBe('id-1')
	})

	it('keeps the same ID across launches', () => {
		launch().getState().ensureDeviceId()

		expect(launch().getState().ensureDeviceId()).toBe('id-1')
	})

	it('opting out forgets the ID and stops handing one out', () => {
		let store = launch()
		store.getState().ensureDeviceId()

		store.getState().optOut()

		expect(store.getState().enabled).toBe(false)
		expect(store.getState().deviceId).toBeNull()
		expect(store.getState().ensureDeviceId()).toBeNull()
	})

	it('opting back in makes a new ID, so the two periods cannot be joined', () => {
		let store = launch()
		store.getState().ensureDeviceId()
		store.getState().optOut()

		store.getState().optIn()

		expect(store.getState().enabled).toBe(true)
		expect(store.getState().deviceId).toBe('id-2')
	})

	// Sentry starts before the first render, so an opt-out must be readable
	// the moment the module loads, not after an async hydration.
	it('has an opted-out choice the moment the store loads', () => {
		launch().getState().optOut()

		expect(launch().getState().enabled).toBe(false)
	})

	it('a stored opt-in with no ID gets one when asked', () => {
		mockItems.set(
			'telemetry-consent',
			JSON.stringify({state: {enabled: true, deviceId: null}, version: 1}),
		)

		expect(launch().getState().ensureDeviceId()).toBe('id-1')
	})
})
