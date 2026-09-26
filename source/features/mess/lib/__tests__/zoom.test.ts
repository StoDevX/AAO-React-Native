import {describe, expect, it} from '@jest/globals'
import {DOUBLE_TAP_SCALE, doubleTapZoom} from '../zoom'

const WINDOW = {width: 400, height: 800}

describe('doubleTapZoom', () => {
	it('zooms in on the point tapped from the whole picture', () => {
		expect(doubleTapZoom(1, {x: 200, y: 400}, WINDOW)).toStrictEqual({
			scale: DOUBLE_TAP_SCALE,
			rect: {x: 120, y: 240, width: 160, height: 320},
		})
	})

	it('zooms back out to the whole picture once zoomed in', () => {
		expect(doubleTapZoom(DOUBLE_TAP_SCALE, {x: 50, y: 60}, WINDOW)).toStrictEqual({
			scale: 1,
			rect: {x: 0, y: 0, width: 400, height: 800},
		})
	})

	it('zooms out from a pinch only a little past the whole picture', () => {
		expect(doubleTapZoom(1.2, {x: 50, y: 60}, WINDOW).scale).toBe(1)
	})

	// A scale view reports as it settles can land a hair off 1; that is the whole picture,
	// and zooming "out" from it would change nothing.
	it.each([1.0000001, 1.004, 0.999])('treats a scale of %s as the whole picture', (scale) => {
		expect(doubleTapZoom(scale, {x: 200, y: 400}, WINDOW).scale).toBe(DOUBLE_TAP_SCALE)
	})
})
