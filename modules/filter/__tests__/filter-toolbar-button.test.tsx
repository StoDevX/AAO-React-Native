import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

import {FilterToolbarButton} from '../filter-toolbar-button'
import type {Filter, ListFilterOption} from '../types'

type Item = {isVegetarian: boolean}

let TOGGLE_FILTER: Filter<Item> = {
	type: 'toggle',
	key: 'vegetarian',
	enabled: false,
	spec: {label: 'Vegetarian only', title: 'Vegetarian'},
	apply: {key: 'isVegetarian'},
}

function manyOptions(count: number): ListFilterOption[] {
	return Array.from({length: count}, (_, i) => ({title: `Dept ${i}`}))
}

// 8 options crosses `filterShape`'s sheet threshold -- the shape whose
// trigger is a plain button rather than a native `Menu`'s own label.
function sheetFilter(enabled: boolean): Filter<Item> {
	return {
		type: 'list',
		key: 'departments',
		enabled,
		spec: {
			title: 'Departments',
			options: manyOptions(8),
			selected: [],
			mode: 'OR',
			displayTitle: true,
		},
		apply: {key: 'isVegetarian'},
	}
}

describe('FilterToolbarButton, inline shape', () => {
	// The dispatcher's whole job is to wire `onChange` through to whichever
	// presentation it picked. This is the only test that exercises that wiring
	// directly -- every other test in the suite exercises what
	// `FilterMenu`/`FilterSheet` do with it, not whether this component forwards
	// it at all.
	test('forwards a tap through to onChange', async () => {
		let onChange = jest.fn()
		await render(
			<FilterToolbarButton
				filter={TOGGLE_FILTER}
				isActive={false}
				onChange={onChange}
				title={TOGGLE_FILTER.spec.title}
			/>,
		)

		await fireEvent.press(screen.getByRole('button', {name: 'Vegetarian'}))

		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({enabled: true}))
	})
})

describe('FilterToolbarButton, sheet shape', () => {
	// The dispatcher's whole job, for this shape, is wiring the sheet's own
	// trigger up at all: a press has to reveal a row.
	test('pressing the trigger opens the sheet', async () => {
		await render(
			<FilterToolbarButton
				filter={sheetFilter(false)}
				isActive={false}
				onChange={jest.fn()}
				title="Departments"
			/>,
		)

		expect(screen.queryByText('Dept 0')).toBeNull()

		await fireEvent.press(screen.getByRole('button', {name: 'Departments'}))

		expect(screen.getByText('Dept 0')).toBeTruthy()
	})
})
