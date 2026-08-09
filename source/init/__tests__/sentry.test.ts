describe('sentry install', () => {
	afterEach(() => {
		jest.resetModules()
		jest.restoreAllMocks()
	})

	it('initializes Sentry even outside production, disabled, so wrap always has a client', () => {
		jest.doMock('@frogpond/constants', () => ({IS_PRODUCTION: false}))
		jest.doMock('../constants', () => ({SENTRY_DSN: 'test-dsn'}))
		const init = jest.fn()
		jest.doMock('@sentry/react-native', () => ({
			init,
			reactNavigationIntegration: () => ({}),
			hermesProfilingIntegration: () => ({}),
		}))

		// eslint-disable-next-line @typescript-eslint/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
		require('../sentry')

		expect(init).toHaveBeenCalledTimes(1)
		expect(init).toHaveBeenCalledWith(
			expect.objectContaining({enabled: false, enableMetricKit: true}),
		)
	})

	it('enables reporting in production', () => {
		jest.doMock('@frogpond/constants', () => ({IS_PRODUCTION: true}))
		jest.doMock('../constants', () => ({SENTRY_DSN: 'test-dsn'}))
		const init = jest.fn()
		jest.doMock('@sentry/react-native', () => ({
			init,
			reactNavigationIntegration: () => ({}),
			hermesProfilingIntegration: () => ({}),
		}))

		// eslint-disable-next-line @typescript-eslint/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
		require('../sentry')

		expect(init).toHaveBeenCalledWith(expect.objectContaining({enabled: true}))
	})
})
