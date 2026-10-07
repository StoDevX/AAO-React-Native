import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {cpuLoad, freeBytesFromVmStat} from './sample-runner-load.mjs'

describe('cpuLoad', () => {
	it('averages the cores and picks out the busiest, from the ticks between two readings', () => {
		const before = [
			{busy: 100, total: 200},
			{busy: 100, total: 200},
		]
		const after = [
			{busy: 150, total: 300},
			{busy: 190, total: 300},
		]

		assert.deepEqual(cpuLoad(before, after), {avg: 70, max: 90})
	})

	it('counts a core that did nothing as idle rather than dividing by zero', () => {
		const reading = [{busy: 100, total: 200}]

		assert.deepEqual(cpuLoad(reading, reading), {avg: 0, max: 0})
	})

	it('gives nothing when the core count changed between readings', () => {
		assert.equal(cpuLoad([{busy: 1, total: 2}], []), undefined)
	})
})

describe('freeBytesFromVmStat', () => {
	it('adds the free, inactive and speculative pages', () => {
		const vmStat = [
			'Mach Virtual Memory Statistics: (page size of 16384 bytes)',
			'Pages free:                               10.',
			'Pages active:                            500.',
			'Pages inactive:                           20.',
			'Pages speculative:                         5.',
			'Pages throttled:                           0.',
		].join('\n')

		assert.equal(freeBytesFromVmStat(vmStat), 35 * 16384)
	})

	it('gives nothing for output it does not recognize', () => {
		assert.equal(freeBytesFromVmStat('vm_stat: command not found'), undefined)
	})
})
