import {describe, expect, test} from '@jest/globals'

import {createPlaybackAttempt, normalizePlaybackError} from '../playback-diagnostics'

const SESSION = {stationId: 'ksto', playerKey: 1} as const
const SHIPPED = 'https://radio.example/shipped.m3u8'
const PUBLISHED = 'https://radio.example/published.m3u8'
const UNKNOWN = 'Some mysterious, uncataloged error'

describe('normalizePlaybackError', () => {
	test.each([
		'Cannot Open',
		'The operation could not be completed.',
		'Could not connect to the server.',
		'Operation Stopped',
	])('keeps the reviewed message %s', (message) => {
		expect(normalizePlaybackError(` \n${message}\t`)).toBe(message)
	})

	test.each([
		'',
		' \n',
		'Unknown error',
		'The stream could not be played.',
		'Impossible d’ouvrir',
		'Cannot Open https://radio.example/private?token=secret',
		'The operation could not be completed. person@example.com',
		'Failed for person@example.com at file:///private/personal-recording.mp3',
	])('replaces the entire unreviewed message %j', (message) => {
		expect(normalizePlaybackError(message)).toBe(UNKNOWN)
	})
})

describe('playback attempts', () => {
	test('a published startup failure tries the shipped source with a normalized diagnostic', () => {
		let attempt = createPlaybackAttempt(SESSION, PUBLISHED, SHIPPED)
		expect(attempt.reportFailure(SESSION, 'Cannot Open')).toEqual({
			name: 'radio.play.failure',
			attributes: {
				station: 'ksto',
				message: 'Cannot Open',
				source: 'published',
				phase: 'startup',
				outcome: 'trying_fallback',
			},
		})
	})

	test('a shipped startup failure stops instead of retrying the same source', () => {
		let attempt = createPlaybackAttempt(SESSION, SHIPPED, SHIPPED)
		expect(attempt.reportFailure(SESSION, 'URL with secrets')).toMatchObject({
			attributes: {message: UNKNOWN, source: 'shipped', phase: 'startup', outcome: 'stopped'},
		})
	})

	test.each([PUBLISHED, SHIPPED])('a failure after audio from %s stops', (url) => {
		let attempt = createPlaybackAttempt(SESSION, url, SHIPPED)
		expect(attempt.reportPlaying(SESSION)).toBe(true)
		expect(attempt.reportFailure(SESSION, 'Cannot Open')).toMatchObject({
			attributes: {phase: 'after_playback', outcome: 'stopped'},
		})
	})

	test.each([
		{stationId: null, playerKey: 1},
		{stationId: 'krlx', playerKey: 2},
		{stationId: 'ksto', playerKey: 2},
	] as const)('ignores playing and failure callbacks outside the session: %j', (current) => {
		let attempt = createPlaybackAttempt(SESSION, PUBLISHED, SHIPPED)
		expect(attempt.reportPlaying(current)).toBe(false)
		expect(attempt.reportFailure(current, 'Cannot Open')).toBeNull()
	})

	test('duplicate callbacks cannot retry or report a failed source again', () => {
		let attempt = createPlaybackAttempt(SESSION, PUBLISHED, SHIPPED)
		expect(attempt.reportFailure(SESSION, 'Cannot Open')).not.toBeNull()
		expect(attempt.reportPlaying(SESSION)).toBe(false)
		expect(attempt.reportFailure(SESSION, 'A different error')).toBeNull()
	})

	test('fallback and user retry each get a separate attempt', () => {
		let published = createPlaybackAttempt(SESSION, PUBLISHED, SHIPPED)
		let fallback = createPlaybackAttempt(SESSION, SHIPPED, SHIPPED)
		let nextSession = {...SESSION, playerKey: 2}
		let retry = createPlaybackAttempt(nextSession, PUBLISHED, SHIPPED)
		expect(published.reportFailure(SESSION, 'Cannot Open')).not.toBeNull()
		expect(fallback.reportFailure(SESSION, 'Cannot Open')).not.toBeNull()
		expect(retry.reportFailure(nextSession, 'Cannot Open')).not.toBeNull()
	})
})
