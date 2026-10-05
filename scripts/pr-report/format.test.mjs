import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {formatBytes, formatDelta, formatPercent} from './format.mjs'

describe('formatBytes', () => {
	it('picks the largest unit under 1024', () => {
		assert.equal(formatBytes(512), '512 B')
		assert.equal(formatBytes(12.3 * 1024), '12.3 KiB')
		assert.equal(formatBytes(4.21 * 1024 * 1024), '4.21 MiB')
	})

	it('keeps the sign of a negative figure', () => {
		assert.equal(formatBytes(-2048), '-2.0 KiB')
	})

	it('rounds before picking the unit', () => {
		assert.equal(formatBytes(1048575), '1.00 MiB')
		assert.equal(formatBytes(1023.6), '1.0 KiB')
	})
})

describe('formatDelta', () => {
	it('signs growth and leaves zero and shrinkage alone', () => {
		assert.equal(formatDelta(2048), '+2.0 KiB')
		assert.equal(formatDelta(0), '0 B')
		assert.equal(formatDelta(-1), '-1 B')
	})
})

describe('formatPercent', () => {
	it('gives one decimal place with a sign', () => {
		assert.equal(formatPercent(3, 1000), '+0.3%')
		assert.equal(formatPercent(-50, 1000), '-5.0%')
	})

	it('is empty when there is nothing to compare with', () => {
		assert.equal(formatPercent(10, null), '')
		assert.equal(formatPercent(10, 0), '')
	})
})
