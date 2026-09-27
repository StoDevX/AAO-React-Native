import {describe, expect, test} from '@jest/globals'

import {reducer, toggleHomeGroup} from '../home'

function initial() {
	return reducer(undefined, {type: '@@INIT'})
}

describe('collapsed home groups', () => {
	test('start with every group open', () => {
		expect(initial().collapsedGroups).toEqual([])
	})

	test('toggling a group collapses it', () => {
		let state = reducer(initial(), toggleHomeGroup('eat'))

		expect(state.collapsedGroups).toEqual(['eat'])
	})

	test('toggling it again opens it', () => {
		let state = reducer(initial(), toggleHomeGroup('eat'))
		state = reducer(state, toggleHomeGroup('eat'))

		expect(state.collapsedGroups).toEqual([])
	})

	test('each group keeps its own state', () => {
		let state = reducer(initial(), toggleHomeGroup('eat'))
		state = reducer(state, toggleHomeGroup('listen-watch'))
		state = reducer(state, toggleHomeGroup('eat'))

		expect(state.collapsedGroups).toEqual(['listen-watch'])
	})
})
