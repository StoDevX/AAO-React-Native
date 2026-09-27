import {describe, expect, test} from '@jest/globals'

import {highlightedFeatureId, placeStack, type StackEntry, stackEntryKey} from '../place-stack'
import type {BuildingType} from '../../../building-hours/types'

const buntrock: StackEntry = {kind: 'feature', id: 'bc'}
const theCage: StackEntry = {kind: 'feature', id: 'thecage'}
const kitchen: StackEntry = {kind: 'venue', name: 'The Pause Kitchen'}

function venue(name: string, building?: string): BuildingType {
	return {name, category: 'Food', kind: 'space', building, schedule: []}
}

describe('placeStack', () => {
	test('pushes a place on top', () => {
		expect(placeStack([buntrock], {type: 'push', entry: theCage})).toEqual([buntrock, theCage])
	})

	test('pops back to the sheet beneath the one that closed', () => {
		expect(placeStack([buntrock, theCage, kitchen], {type: 'pop', depth: 1})).toEqual([buntrock])
	})

	// A sheet closed by its button also reports that it is no longer presented;
	// the second report must not close the sheet beneath it too.
	test('pops once however many times the same sheet reports closing', () => {
		let once = placeStack([buntrock, theCage, kitchen], {type: 'pop', depth: 2})
		expect(placeStack(once, {type: 'pop', depth: 2})).toEqual([buntrock, theCage])
	})

	test('ignores a pop deeper than the stack', () => {
		expect(placeStack([buntrock], {type: 'pop', depth: 3})).toEqual([buntrock])
	})

	test('starts afresh from a place chosen on the map or in search', () => {
		expect(placeStack([buntrock, theCage], {type: 'start', id: 'hh'})).toEqual([
			{kind: 'feature', id: 'hh'},
		])
	})

	test('clears when the first card closes', () => {
		expect(placeStack([buntrock, theCage], {type: 'clear'})).toEqual([])
	})
})

describe('highlightedFeatureId', () => {
	test('is nothing for an empty stack', () => {
		expect(highlightedFeatureId([], [])).toBeNull()
	})

	test("is the top feature's id", () => {
		expect(highlightedFeatureId([buntrock, theCage], [])).toBe('thecage')
	})

	test('is the feature a venue on top is keyed to', () => {
		let venues = [venue('The Pause Kitchen', 'thelionspause')]
		expect(highlightedFeatureId([buntrock, kitchen], venues)).toBe('thelionspause')
	})

	test('falls back down the stack for a venue it cannot place', () => {
		expect(highlightedFeatureId([buntrock, kitchen], [])).toBe('bc')
		expect(highlightedFeatureId([buntrock, kitchen], [venue('The Pause Kitchen')])).toBe('bc')
	})
})

describe('a floor on the stack', () => {
	const floor = {kind: 'floor', building: 'toh', floor: 1} as const

	test('stacks over its building and pops back to it', () => {
		let stack = placeStack([{kind: 'feature', id: 'toh'}], {type: 'push', entry: floor})
		expect(stack).toEqual([{kind: 'feature', id: 'toh'}, floor])
		expect(placeStack(stack, {type: 'pop', depth: 1})).toEqual([{kind: 'feature', id: 'toh'}])
	})

	// The card beneath is another place, so falling through to it would show.
	test('highlights its own building', () => {
		expect(highlightedFeatureId([{kind: 'feature', id: 'bc'}, floor], [])).toBe('toh')
	})

	test('keys each floor apart', () => {
		expect(stackEntryKey(floor)).not.toBe(stackEntryKey({...floor, floor: 2}))
		expect(stackEntryKey({kind: 'venue', name: 'Registrar'})).toBe('venue:Registrar')
	})
})
