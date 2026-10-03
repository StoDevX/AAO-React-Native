import {describe, expect, test} from '@jest/globals'

import {audioActivity} from '../audio-activity'

const IDLE = {playing: false, isBuffering: false, didJustFinish: false, error: null}

describe('audioActivity', () => {
	test('is idle before anything has played', () => {
		expect(audioActivity(IDLE)).toBe('idle')
	})

	test('is playing once audio is playing and the buffer is not dry', () => {
		expect(audioActivity({...IDLE, playing: true})).toBe('playing')
	})

	test('is waiting while the buffer fills, whether or not it was playing', () => {
		expect(audioActivity({...IDLE, isBuffering: true})).toBe('waiting')
		expect(audioActivity({...IDLE, playing: true, isBuffering: true})).toBe('waiting')
	})

	test('is ended when the player says it finished', () => {
		expect(audioActivity({...IDLE, didJustFinish: true})).toBe('ended')
	})

	test('is an error whatever else the status says', () => {
		let status = {
			...IDLE,
			playing: true,
			isBuffering: true,
			error: 'The stream could not be played.',
		}
		expect(audioActivity(status)).toBe('error')
	})
})
