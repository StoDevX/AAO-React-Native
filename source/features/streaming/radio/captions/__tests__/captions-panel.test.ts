import {describe, expect, test} from '@jest/globals'

import {
	captionsAvailability,
	captionsButtonLabel,
	resolvePanel,
	selectPanel,
	shouldRunCaptions,
} from '../captions-panel'

const KRLX = {captionsSupported: true, stationName: '88.1 KRLX-FM'}
const KSTO = {captionsSupported: false, stationName: 'KSTO 93.1 FM'}

describe('captionsAvailability', () => {
	test('is available for a station that captions, once it is the one loaded and not stopped', () => {
		for (let playState of ['starting', 'playing', 'paused'] as const) {
			expect(captionsAvailability({station: KRLX, viewedIsPlaying: true, playState})).toBe(
				'available',
			)
		}
	})

	test('is unsupported for a station that cannot caption, whatever it is doing', () => {
		expect(captionsAvailability({station: KSTO, viewedIsPlaying: true, playState: 'playing'})).toBe(
			'unsupported',
		)
		expect(
			captionsAvailability({station: KSTO, viewedIsPlaying: false, playState: 'stopped'}),
		).toBe('unsupported')
	})

	test('needs the viewed station to be the loaded one', () => {
		expect(
			captionsAvailability({station: KRLX, viewedIsPlaying: false, playState: 'stopped'}),
		).toBe('not-playing')
		expect(
			captionsAvailability({station: KRLX, viewedIsPlaying: false, playState: 'playing'}),
		).toBe('not-playing')
	})

	test('needs the loaded station not to be stopped', () => {
		expect(captionsAvailability({station: KRLX, viewedIsPlaying: true, playState: 'stopped'})).toBe(
			'not-playing',
		)
	})
})

describe('captionsButtonLabel', () => {
	test('names the button, or says why it is dimmed', () => {
		expect(captionsButtonLabel('available', KRLX.stationName)).toBe('Captions')
		expect(captionsButtonLabel('unsupported', KSTO.stationName)).toBe(
			'Captions are not available for KSTO 93.1 FM',
		)
		expect(captionsButtonLabel('not-playing', KRLX.stationName)).toBe(
			'Captions need the station to be playing',
		)
	})
})

describe('shouldRunCaptions', () => {
	const running = {
		active: true,
		station: KRLX,
		viewedIsPlaying: true,
		playState: 'playing' as const,
	}

	test('runs while the captions panel shows a playing, captioning station', () => {
		expect(shouldRunCaptions(running)).toBe(true)
	})

	test('does not run behind another panel', () => {
		expect(shouldRunCaptions({...running, active: false})).toBe(false)
	})

	test('does not run for a station that cannot caption', () => {
		expect(shouldRunCaptions({...running, station: KSTO})).toBe(false)
	})

	test('does not run for a station that is not the one playing', () => {
		expect(shouldRunCaptions({...running, viewedIsPlaying: false})).toBe(false)
	})

	test('does not run unless the station is playing audio', () => {
		for (let playState of ['stopped', 'starting', 'paused'] as const) {
			expect(shouldRunCaptions({...running, playState})).toBe(false)
		}
	})
})

describe('selectPanel', () => {
	test('shows the panel whose button was pressed', () => {
		expect(selectPanel('record', 'captions')).toBe('captions')
		expect(selectPanel('record', 'schedule')).toBe('schedule')
		expect(selectPanel('schedule', 'captions')).toBe('captions')
		expect(selectPanel('captions', 'schedule')).toBe('schedule')
	})

	test('returns to the record when the showing panel is pressed again', () => {
		expect(selectPanel('captions', 'captions')).toBe('record')
		expect(selectPanel('schedule', 'schedule')).toBe('record')
	})
})

describe('resolvePanel', () => {
	test('opens on the captions panel when the viewer left it selected and it can run', () => {
		expect(resolvePanel({chosen: null, captionsOn: true, availability: 'available'})).toBe(
			'captions',
		)
	})

	test('opens on the record when captions are off, or cannot run', () => {
		expect(resolvePanel({chosen: null, captionsOn: false, availability: 'available'})).toBe(
			'record',
		)
		expect(resolvePanel({chosen: null, captionsOn: true, availability: 'unsupported'})).toBe(
			'record',
		)
		expect(resolvePanel({chosen: null, captionsOn: true, availability: 'not-playing'})).toBe(
			'record',
		)
	})

	test('keeps the panel the viewer chose this time, whatever the preference', () => {
		expect(resolvePanel({chosen: 'schedule', captionsOn: true, availability: 'available'})).toBe(
			'schedule',
		)
		expect(resolvePanel({chosen: 'record', captionsOn: true, availability: 'available'})).toBe(
			'record',
		)
		expect(resolvePanel({chosen: 'captions', captionsOn: false, availability: 'available'})).toBe(
			'captions',
		)
	})

	test('falls back to the record when a chosen captions panel can no longer run', () => {
		expect(resolvePanel({chosen: 'captions', captionsOn: true, availability: 'unsupported'})).toBe(
			'record',
		)
		expect(resolvePanel({chosen: 'captions', captionsOn: true, availability: 'not-playing'})).toBe(
			'record',
		)
	})
})
