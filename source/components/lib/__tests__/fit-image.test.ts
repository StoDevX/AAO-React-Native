import {describe, expect, it} from '@jest/globals'
import {fitImage} from '../fit-image'

describe('fitImage', () => {
	it('fills the row with a picture short enough to', () => {
		// 1600x900 in a 360pt row is 202.5pt tall, under the cap.
		expect(fitImage({rowWidth: 360, imageWidth: 1600, imageHeight: 900, maxHeight: 250})).toEqual({
			width: 360,
			height: 202.5,
		})
	})

	it('shrinks a tall picture to the cap and narrows it with it, rather than cropping', () => {
		// 1000x3000 would be 1080pt tall at full width; capped at 250 it is a third as wide.
		let {width, height} = fitImage({
			rowWidth: 360,
			imageWidth: 1000,
			imageHeight: 3000,
			maxHeight: 250,
		})
		expect(height).toBe(250)
		expect(width).toBeCloseTo(250 / 3)
	})

	it('keeps the picture whole at any size', () => {
		let {width, height} = fitImage({
			rowWidth: 360,
			imageWidth: 800,
			imageHeight: 30000,
			maxHeight: 250,
		})
		expect(height).toBe(250)
		expect(width / height).toBeCloseTo(800 / 30000)
	})

	it('scales a small picture up to the row, as a banner would', () => {
		expect(fitImage({rowWidth: 360, imageWidth: 90, imageHeight: 45, maxHeight: 250})).toEqual({
			width: 360,
			height: 180,
		})
	})

	it('has no size before the row has been measured', () => {
		expect(fitImage({rowWidth: 0, imageWidth: 1600, imageHeight: 900, maxHeight: 250})).toEqual({
			width: 0,
			height: 0,
		})
	})

	it('has no size for a picture reporting none', () => {
		expect(fitImage({rowWidth: 360, imageWidth: 0, imageHeight: 0, maxHeight: 250})).toEqual({
			width: 0,
			height: 0,
		})
	})
})
