import {describe, expect, test} from '@jest/globals'

import {describePlayback} from '../describe-playback'

describe('describePlayback', () => {
	test('names each state', () => {
		expect(describePlayback('playing', null)).toBe('Playing')
		expect(describePlayback('checking', null)).toBe('Starting…')
		expect(describePlayback('loading', null)).toBe('Starting…')
		expect(describePlayback('paused', null)).toBe('Paused')
	})

	test('says when the station could not play', () => {
		expect(describePlayback('paused', {code: 4, message: 'gone'})).toBe('Couldn’t play')
	})
})
