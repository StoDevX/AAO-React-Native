import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {ACTIVE_TRIGGER_MODIFIERS, FilterMenu, INACTIVE_TRIGGER_MODIFIERS} from '../filter-menu'
import {FILTER_TRIGGER_PREFIX} from '../lib/trigger-modifiers'
import type {ListItemSpecType, ListType, PickerType, ToggleType} from '../types'
import {accessibilityIdentifier} from './expo-ui-mock'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

type Row = {x: string}

function toggleFilter(enabled: boolean): ToggleType<Row> {
	return {
		type: 'toggle',
		key: 'k',
		enabled,
		spec: {label: 'Specials Only', title: 'Specials'},
		apply: {key: 'x'},
	}
}

function pickerFilter(options: {label: string}[], selected?: {label: string}): PickerType<Row> {
	return {
		type: 'picker',
		key: 'k',
		enabled: true,
		spec: {title: 'Level', options, selected},
		apply: {key: 'x'},
	}
}

function listFilter(
	mode: 'AND' | 'OR',
	options: ListItemSpecType[],
	selected: ListItemSpecType[],
	displayTitle = true,
): ListType<Row> {
	return {
		type: 'list',
		key: 'k',
		enabled: false,
		spec: {title: 'Stations', options, selected, mode, displayTitle},
		apply: {key: 'x'},
	} as ListType<Row>
}

describe('FilterMenu, toggle', () => {
	test('emits enabled flipped', async () => {
		let onChange = jest.fn()
		await render(<FilterMenu filter={toggleFilter(false)} isActive={false} onChange={onChange} />)

		await fireEvent.press(screen.getByText('Specials Only'))

		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({enabled: true}))
	})
})

describe('FilterMenu, picker', () => {
	test('emits the tapped option', async () => {
		let onChange = jest.fn()
		let options = [{label: 'First-year'}, {label: 'Sophomore'}, {label: 'Junior'}]
		await render(<FilterMenu filter={pickerFilter(options)} isActive={false} onChange={onChange} />)

		await fireEvent.press(screen.getByText('Sophomore'))

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({spec: expect.objectContaining({selected: options[1]})}),
		)
	})

	test('renders nothing with one option', async () => {
		await render(
			<FilterMenu filter={pickerFilter([{label: 'Only'}])} isActive={false} onChange={jest.fn()} />,
		)

		expect(screen.toJSON()).toBeNull()
	})

	test('renders nothing with no options', async () => {
		await render(<FilterMenu filter={pickerFilter([])} isActive={false} onChange={jest.fn()} />)

		expect(screen.toJSON()).toBeNull()
	})
})

describe('FilterMenu, list', () => {
	test('offers "Show All" in OR mode', async () => {
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterMenu filter={listFilter('OR', options, [])} isActive={false} onChange={jest.fn()} />,
		)

		expect(screen.getByText('Show All')).toBeTruthy()
	})

	test('does not offer "Show All" in AND mode', async () => {
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterMenu filter={listFilter('AND', options, [])} isActive={false} onChange={jest.fn()} />,
		)

		expect(screen.queryByText('Show All')).toBeNull()
	})

	test('tapping an option emits the toggled selection', async () => {
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}, {title: 'C'}]
		await render(
			<FilterMenu
				filter={listFilter('OR', options, [{title: 'A'}])}
				isActive={false}
				onChange={onChange}
			/>,
		)

		await fireEvent.press(screen.getByText('B'))

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				spec: expect.objectContaining({selected: [{title: 'A'}, {title: 'B'}]}),
			}),
		)
	})

	test('tapping "Show All" emits the toggled-all selection', async () => {
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterMenu
				filter={listFilter('OR', options, [{title: 'A'}])}
				isActive={false}
				onChange={onChange}
			/>,
		)

		await fireEvent.press(screen.getByText('Show All'))

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({spec: expect.objectContaining({selected: options})}),
		)
	})

	test('renders nothing when there are no options', async () => {
		await render(
			<FilterMenu filter={listFilter('OR', [], [])} isActive={false} onChange={jest.fn()} />,
		)

		expect(screen.toJSON()).toBeNull()
	})

	test('displayTitle false renders by label, not title', async () => {
		let options = [{title: 'BIO', label: 'Biology'}]
		await render(
			<FilterMenu
				filter={listFilter('AND', options, [], false)}
				isActive={false}
				onChange={jest.fn()}
			/>,
		)

		expect(screen.getByText('Biology')).toBeTruthy()
		expect(screen.queryByText('BIO')).toBeNull()
	})
})

// Every branch of the switch in `filter-menu.tsx` builds its own `Menu`, so
// each has to wire the title into its own `Section` independently -- a
// mutation dropping it from just one branch would leave the other two
// covered here green.
describe('FilterMenu, section title', () => {
	test('toggle: states the filter title on the section', async () => {
		await render(<FilterMenu filter={toggleFilter(false)} isActive={false} onChange={jest.fn()} />)

		expect(screen.getByText('SPECIALS')).toBeTruthy()
	})

	test('picker: states the filter title on the section', async () => {
		let options = [{label: 'First-year'}, {label: 'Sophomore'}]
		await render(
			<FilterMenu filter={pickerFilter(options)} isActive={false} onChange={jest.fn()} />,
		)

		expect(screen.getByText('LEVEL')).toBeTruthy()
	})

	test('list: states the filter title on the section', async () => {
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterMenu filter={listFilter('OR', options, [])} isActive={false} onChange={jest.fn()} />,
		)

		expect(screen.getByText('STATIONS')).toBeTruthy()
	})
})

describe('FilterMenu, active state', () => {
	// The menu's label is its own trigger -- there is no separate button --
	// so "this filter is narrowing something" has to live on the trigger's own
	// modifiers. The style and trait entries are compared against the exported
	// constants rather than a literal shape, so the mock's own invented
	// `Modifier` representation cannot stand in for what `filter-menu.tsx`
	// decided; the identifier is built with the same mocked `modifiers` module
	// the component calls, for the same reason.
	test('inactive: the inactive trigger modifiers', async () => {
		await render(<FilterMenu filter={toggleFilter(false)} isActive={false} onChange={jest.fn()} />)

		let trigger = screen.getByTestId('menu:Specials')
		expect(trigger.props.modifiers).toEqual([
			...INACTIVE_TRIGGER_MODIFIERS,
			accessibilityIdentifier(`${FILTER_TRIGGER_PREFIX}k`),
		])
	})

	test('active: the active trigger modifiers', async () => {
		await render(<FilterMenu filter={toggleFilter(true)} isActive={true} onChange={jest.fn()} />)

		let trigger = screen.getByTestId('menu:Specials')
		expect(trigger.props.modifiers).toEqual([
			...ACTIVE_TRIGGER_MODIFIERS,
			accessibilityIdentifier(`${FILTER_TRIGGER_PREFIX}k`),
		])
	})
})
