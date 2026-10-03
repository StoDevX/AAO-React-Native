import {describe, expect, test} from '@jest/globals'

import {artworkSize} from '../player-view/artwork-size'

describe('artworkSize', () => {
	test('fills the width when there is height to spare', () => {
		expect(
			artworkSize({width: 346, viewportHeight: 900, layoutHeight: 800, currentArtwork: 346}),
		).toBe(346)
	})

	test('shrinks to the height the rest of the player leaves', () => {
		// The player is 779pt with a 346pt record, so the rest is 433pt;
		// in a 675pt viewport that leaves 242pt.
		expect(
			artworkSize({width: 346, viewportHeight: 675, layoutHeight: 779, currentArtwork: 346}),
		).toBe(242)
	})

	test('grows back when the viewport does', () => {
		expect(
			artworkSize({width: 346, viewportHeight: 758, layoutHeight: 675, currentArtwork: 242}),
		).toBe(325)
	})

	test('stops at the smallest record, and leaves the rest to scroll', () => {
		expect(
			artworkSize({width: 346, viewportHeight: 500, layoutHeight: 779, currentArtwork: 346}),
		).toBe(160)
	})

	test('fills the width until the viewport is known', () => {
		expect(artworkSize({width: 346, viewportHeight: 0, layoutHeight: 0, currentArtwork: 346})).toBe(
			346,
		)
	})
})
