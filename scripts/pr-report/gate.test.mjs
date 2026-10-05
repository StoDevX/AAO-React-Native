import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {decideGate} from './gate.mjs'

let growth = (delta) => ({name: 'hermes', before: 1000, after: 1000 + delta, delta})

describe('decideGate', () => {
	it('passes growth equal to the limit', () => {
		let gate = decideGate({hermes: growth(100), labels: [], limit: 100})
		assert.equal(gate.pass, true)
	})

	it('fails growth over the limit, naming the growth, limit and label', () => {
		let gate = decideGate({hermes: growth(101 * 1024), labels: [], limit: 100 * 1024})
		assert.equal(gate.pass, false)
		assert.equal(
			gate.message,
			'Hermes bytecode grew 101.0 KiB, over the 100.0 KiB limit. Add the `size/accepted` label if the growth is intended.',
		)
	})

	it('passes growth over the limit when the PR accepts it', () => {
		let gate = decideGate({
			hermes: growth(200),
			labels: ['dependencies', 'size/accepted'],
			limit: 100,
		})
		assert.equal(gate.pass, true)
		assert.match(gate.message, /accepted/u)
	})

	it('passes a shrink', () => {
		assert.equal(decideGate({hermes: growth(-5000), labels: [], limit: 100}).pass, true)
	})

	it('passes when there is no baseline to compare with', () => {
		let gate = decideGate({hermes: null, labels: [], limit: 100})
		assert.equal(gate.pass, true)
		assert.match(gate.message, /no baseline/iu)
	})
})
