import {expect, test} from '@jest/globals'

import {stopCellWidth} from '../stop-cell-width'

test('is 86pt at the default text size', () => {
	expect(stopCellWidth(1)).toBe(86)
})

test('stays 86pt at smaller text sizes', () => {
	expect(stopCellWidth(0.82)).toBe(86)
})

test('grows in step with larger text', () => {
	expect(stopCellWidth(1.5)).toBe(129)
	expect(stopCellWidth(3.12)).toBeCloseTo(268.32)
})
