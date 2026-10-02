import * as Sentry from '@sentry/react-native'

import type {PublicEventTitle, QueryKeyHead} from '../catalog'
import {track} from '../track'

jest.mock('@sentry/react-native', () => ({
	metrics: {count: jest.fn()},
	logger: {warn: jest.fn(), info: jest.fn()},
	Scope: jest.fn(),
}))

beforeEach(() => {
	jest.clearAllMocks()
})

describe('track', () => {
	it('counts a metric event once, with its attributes', () => {
		track({name: 'calendar.filter.apply', attributes: {axis: 'category'}})

		expect(Sentry.metrics.count).toHaveBeenCalledWith('calendar.filter.apply', 1, {
			attributes: {axis: 'category'},
		})
		expect(Sentry.logger.warn).not.toHaveBeenCalled()
	})

	it('sends a log event as a warning, with its attributes', () => {
		let source = 'news' as QueryKeyHead
		track({name: 'api.failure', attributes: {source, kind: 'http', status: 503}})

		expect(Sentry.logger.warn).toHaveBeenCalledWith('api.failure', {
			source: 'news',
			kind: 'http',
			status: 503,
		})
		expect(Sentry.metrics.count).not.toHaveBeenCalled()
	})

	// A fresh scope has its own trace ID and no active span, so the log can't
	// be joined to a trace that carries the device ID.
	it('sends an anonymous event on a scope of its own, marked for stripping', () => {
		let title = 'Founders Day' as PublicEventTitle
		track({
			name: 'calendar.event.added',
			anonymous: true,
			attributes: {source: 'stolaf', title},
		})

		let [scope] = jest.mocked(Sentry.Scope).mock.instances
		expect(Sentry.logger.info).toHaveBeenCalledWith(
			'calendar.event.added',
			{source: 'stolaf', title: 'Founders Day', 'telemetry.anonymous': true},
			{scope},
		)
		expect(Sentry.logger.warn).not.toHaveBeenCalled()
		expect(Sentry.metrics.count).not.toHaveBeenCalled()
	})

	it('swallows a failure inside Sentry, so the screen that reported it carries on', () => {
		jest.mocked(Sentry.metrics.count).mockImplementationOnce(() => {
			throw new Error('transport exploded')
		})

		expect(() => track({name: 'map.search.empty', attributes: {}})).not.toThrow()
	})
})
