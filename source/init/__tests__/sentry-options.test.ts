import {privacyOptions} from '../sentry-options'

function options(overrides: Partial<Parameters<typeof privacyOptions>[0]> = {}) {
	return privacyOptions({
		isProduction: true,
		consented: true,
		isPrerelease: false,
		isConsented: () => true,
		...overrides,
	})
}

describe('privacyOptions', () => {
	it.each([
		{isProduction: true, consented: true, enabled: true},
		{isProduction: true, consented: false, enabled: false},
		{isProduction: false, consented: true, enabled: false},
		{isProduction: false, consented: false, enabled: false},
	])(
		'sends only from a release build someone consented on (production $isProduction, consented $consented)',
		({isProduction, consented, enabled}) => {
			expect(options({isProduction, consented}).enabled).toBe(enabled)
		},
	)

	it('attaches screenshots and the view hierarchy only to prerelease builds', () => {
		expect(options({isPrerelease: true})).toMatchObject({
			attachScreenshot: true,
			attachViewHierarchy: true,
		})
		expect(options({isPrerelease: false})).toMatchObject({
			attachScreenshot: false,
			attachViewHierarchy: false,
		})
	})

	// With logs on, the SDK would otherwise capture every console call and
	// native log line, and those can hold anything.
	it('sends only the logs track() writes', () => {
		expect(options()).toMatchObject({
			enableLogs: true,
			logsOrigin: 'js',
			enableAutoConsoleLogs: false,
			enableMetrics: true,
		})
	})

	// The React Native SDK still reads sendDefaultPii, not the newer
	// dataCollection option: with it off, Sentry records no IP address and the
	// SDK attaches no request headers or cookies, and strips deep-link queries.
	it('sends no default personal data, IP address included', () => {
		// oxlint-disable-next-line typescript/no-deprecated
		expect(options().sendDefaultPii).toBe(false)
	})

	it('strips the device ID and span link from an anonymous log', () => {
		let log = {
			level: 'info' as const,
			message: 'calendar.event.added',
			attributes: {
				source: 'stolaf',
				title: 'Founders Day',
				'telemetry.anonymous': true,
				'user.id': 'id-1',
				'sentry.trace.parent_span_id': 'abc123',
				'sentry.release': '2.9.0',
			},
		}

		expect(options().beforeSendLog?.(log)).toStrictEqual({
			level: 'info',
			message: 'calendar.event.added',
			attributes: {source: 'stolaf', title: 'Founders Day', 'sentry.release': '2.9.0'},
		})
	})

	it('leaves the device ID on an ordinary log', () => {
		let log = {
			level: 'warn' as const,
			message: 'api.failure',
			attributes: {source: 'news', 'user.id': 'id-1'},
		}

		expect(options().beforeSendLog?.(log)).toBe(log)
	})

	// The scrubbers themselves are tested in scrub.test.ts; these check that
	// each hook uses one.
	// The native SDK's own request breadcrumbs carry full URLs that JS never
	// sees to scrub; they ride along on native crash reports.
	it('turns off native request breadcrumbs', () => {
		expect(options()).toMatchObject({enableNetworkBreadcrumbs: false})
	})

	it('drops console breadcrumbs', () => {
		expect(options().beforeBreadcrumb?.({category: 'console', message: 'x'})).toBeNull()
	})

	it('scrubs URLs in spans', () => {
		let span = {
			span_id: 'a',
			trace_id: 'b',
			start_timestamp: 1,
			description: 'GET https://example.test/search?name=Jane',
			data: {},
		}

		expect(options().beforeSendSpan?.(span).description).toBe('GET https://example.test/search')
	})

	it('scrubs the request on an error event', () => {
		let event = {type: undefined, request: {url: 'https://example.test/search?name=Jane'}}

		expect(options().beforeSend?.(event, {})).toStrictEqual({
			type: undefined,
			request: {url: 'https://example.test/search'},
		})
	})

	it('drops anything sent after an opt-out, reading the choice at send time', () => {
		let shared = true
		let built = options({isConsented: () => shared})
		let hooks = [
			built.beforeSend,
			built.beforeSendTransaction,
			built.beforeSendMetric,
			built.beforeSendLog,
		] as unknown as Array<(item: object, hint?: object) => object | null>
		let item = {marker: true}

		for (let hook of hooks) {
			expect(hook(item, {})).toBe(item)
		}

		shared = false
		for (let hook of hooks) {
			expect(hook(item, {})).toBeNull()
		}
	})
})
