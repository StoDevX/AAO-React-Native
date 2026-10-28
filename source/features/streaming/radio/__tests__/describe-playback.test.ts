import {describe, expect, test} from '@jest/globals'

import {describePlayback} from '../describe-playback'

describe('describePlayback', () => {
	test('names each state', () => {
		expect(describePlayback('playing', null)).toBe('Playing')
		expect(describePlayback('starting', null)).toBe('Starting…')
		expect(describePlayback('paused', null)).toBe('Paused')
		expect(describePlayback('stopped', null)).toBe('Stopped')
	})

	test('says when the station could not play', () => {
		expect(describePlayback('stopped', {code: 4, message: 'gone'})).toBe('Couldn’t play: gone')
	})

	test('keeps the generic error when the native reason is blank', () => {
		expect(describePlayback('stopped', {code: 0, message: '  '})).toBe('Couldn’t play')
	})
})
