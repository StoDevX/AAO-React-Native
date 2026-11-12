import {describe, expect, test} from '@jest/globals'

import {audioActivity, shouldRenderScratch} from '../audio-activity'

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

describe('independent scratch playback', () => {
	test('keeps its renderer running across AVPlayer startup buffering', () => {
		expect(shouldRenderScratch('checking', 'waiting')).toBe(true)
		expect(shouldRenderScratch('playing', 'playing')).toBe(true)
		expect(shouldRenderScratch('playing', 'waiting')).toBe(true)
	})
	test('stops for an explicit pause, interruption, end, or error', () => {
		expect(shouldRenderScratch('paused', 'playing')).toBe(false)
		expect(shouldRenderScratch('paused', 'waiting')).toBe(false)
		for (let activity of ['idle', 'ended', 'error'] as const) {
			expect(shouldRenderScratch('playing', activity)).toBe(false)
		}
	})
})
