import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {APP_GATE_ENFORCED, APP_GROWTH_LIMIT_BYTES, decideAppGate, decideGate} from './gate.mjs'

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

describe('decideAppGate', () => {
	let install = (delta) => ({name: 'install', before: 1000, after: 1000 + delta, delta})

	it('passes growth equal to the limit', () => {
		let gate = decideAppGate({install: install(100), labels: [], limit: 100, enforced: true})
		assert.deepEqual(gate, {pass: true, warn: false, message: 'Within the 100 B limit.'})
	})

	it('fails growth over the limit when enforced, naming the growth, limit and label', () => {
		let gate = decideAppGate({
			install: install(600 * 1024),
			labels: [],
			limit: 500 * 1024,
			enforced: true,
		})
		assert.deepEqual(gate, {
			pass: false,
			warn: false,
			message:
				'App install size grew 600.0 KiB, over the 500.0 KiB limit. Add the `size/accepted` label if the growth is intended.',
		})
	})

	it('passes with a warning when it would fail but is report-only', () => {
		let gate = decideAppGate({
			install: install(600 * 1024),
			labels: [],
			limit: 500 * 1024,
			enforced: false,
		})
		assert.deepEqual(gate, {
			pass: true,
			warn: true,
			message:
				'App install size grew 600.0 KiB, over the 500.0 KiB limit. The app size gate is report-only for now, so this passes.',
		})
	})

	it('passes growth over the limit when the PR accepts it', () => {
		let gate = decideAppGate({
			install: install(200),
			labels: ['size/accepted'],
			limit: 100,
			enforced: true,
		})
		assert.equal(gate.pass, true)
		assert.equal(gate.warn, false)
		assert.match(gate.message, /accepted/u)
	})

	it('passes when there is nothing to compare', () => {
		let gate = decideAppGate({install: null, labels: [], limit: 100, enforced: true})
		assert.deepEqual(gate, {
			pass: true,
			warn: false,
			message: 'No app size to compare with, so the app size gate passes.',
		})
	})

	it('is report-only by default', () => {
		assert.equal(APP_GATE_ENFORCED, false)
		assert.equal(APP_GROWTH_LIMIT_BYTES, 500 * 1024)
	})
})
