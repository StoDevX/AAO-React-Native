import type * as SentryModule from '../sentry'

// Each launch() loads sentry.ts in a fresh module registry, which would build
// a fresh mock from the factory every time. Returning one shared object keeps
// the assertions below looking at the functions sentry.ts actually called.
// Not imported at the top of the file: the import would run before this
// const exists.
const mockSentry = {
	init: jest.fn<void, [options: object]>(),
	close: jest.fn(() => Promise.resolve()),
	setUser: jest.fn(),
	reactNavigationIntegration: jest.fn(() => ({name: 'ReactNavigation'})),
	hermesProfilingIntegration: jest.fn(() => ({name: 'HermesProfiling'})),
}
jest.mock('@sentry/react-native', () => mockSentry)
jest.mock('@frogpond/constants', () => ({IS_PRODUCTION: true, isDebugBuild: () => false}))
// constants.ts reads expo-constants, which needs a native module.
jest.mock('../constants', () => ({SENTRY_DSN: 'https://key@example.test/1'}))

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

/** Loads `sentry.ts` fresh, which starts Sentry, as on a new launch. */
function launch(): typeof SentryModule {
	let loaded: typeof SentryModule | undefined
	jest.isolateModules(() => {
		// oxlint-disable-next-line typescript/no-require-imports
		loaded = require('../sentry') as typeof SentryModule
	})
	if (!loaded) throw new Error('sentry.ts did not load')
	return loaded
}

function lastInitOptions() {
	return mockSentry.init.mock.lastCall?.[0]
}

beforeEach(() => {
	jest.clearAllMocks()
	mockItems.clear()
	mockNextId = 0
})

describe('starting Sentry', () => {
	it('sends by default, with the device ID as the only user field', () => {
		launch()

		expect(lastInitOptions()).toMatchObject({enabled: true})
		expect(mockSentry.setUser).toHaveBeenCalledWith({id: 'id-1'})
	})

	// Interaction spans are named after the text under the finger.
	it('does not trace touches', () => {
		launch()

		expect(lastInitOptions()).toMatchObject({enableUserInteractionTracing: false})
	})

	it('an opted-out person starts with nothing sent and no user', () => {
		mockItems.set(
			'telemetry-consent',
			JSON.stringify({state: {enabled: false, deviceId: null}, version: 1}),
		)

		launch()

		expect(lastInitOptions()).toMatchObject({enabled: false})
		expect(mockSentry.setUser).not.toHaveBeenCalled()
	})
})

describe('setTelemetryConsent', () => {
	it('turning the switch off closes Sentry', async () => {
		let {setTelemetryConsent} = launch()

		await setTelemetryConsent(false)

		expect(mockSentry.close).toHaveBeenCalledTimes(1)
	})

	it('turning it back on starts Sentry again with a new ID', async () => {
		let {setTelemetryConsent} = launch()
		await setTelemetryConsent(false)
		mockSentry.init.mockClear()
		mockSentry.setUser.mockClear()

		await setTelemetryConsent(true)

		expect(lastInitOptions()).toMatchObject({enabled: true})
		expect(mockSentry.setUser).toHaveBeenCalledWith({id: 'id-2'})
	})

	// A close still in flight when the new client starts would shut that
	// client down, leaving the switch on and nothing sent.
	it('turning it back on waits for the close to finish', async () => {
		let finishClose: () => void = () => undefined
		mockSentry.close.mockReturnValueOnce(
			new Promise<void>((resolve) => {
				finishClose = resolve
			}),
		)
		let {setTelemetryConsent} = launch()
		mockSentry.init.mockClear()

		let off = setTelemetryConsent(false)
		let on = setTelemetryConsent(true)
		await Promise.resolve()

		expect(mockSentry.init).not.toHaveBeenCalled()

		finishClose()
		await Promise.all([off, on])

		expect(mockSentry.init).toHaveBeenCalledTimes(1)
		expect(lastInitOptions()).toMatchObject({enabled: true})
	})
})
