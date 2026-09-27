import {describe, it} from 'node:test'
import assert from 'node:assert/strict'
import {directoryKeyProblems} from './building-directory-keys.mjs'

const ids = new Set(['toh', 'admissionsoffice'])

describe('directoryKeyProblems', () => {
	it('passes a file whose building and points are map features', () => {
		assert.deepEqual(
			directoryKeyProblems(
				[{filename: 'toh.yaml', building: 'toh', points: ['admissionsoffice']}],
				ids,
			),
			[],
		)
	})

	it('names a building that is not a map feature', () => {
		assert.deepEqual(
			directoryKeyProblems([{filename: 'tom.yaml', building: 'tom', points: []}], ids),
			['tom.yaml: building "tom" is not a known feature id'],
		)
	})

	it('names a point that is not a map feature', () => {
		assert.deepEqual(
			directoryKeyProblems([{filename: 'toh.yaml', building: 'toh', points: ['nowhere']}], ids),
			['toh.yaml: point "nowhere" is not a known feature id'],
		)
	})

	it('names a file whose name is not its building', () => {
		assert.deepEqual(
			directoryKeyProblems([{filename: 'hh.yaml', building: 'toh', points: []}], ids),
			['hh.yaml: named for "hh" but lists building "toh"'],
		)
	})
})
