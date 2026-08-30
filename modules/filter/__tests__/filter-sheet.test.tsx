import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {FilterSheet} from '../filter-sheet'
import type {FilterIcon, ListItemSpecType, ListType} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

type Row = {x: string}

function listFilter(
	mode: 'AND' | 'OR',
	options: ListItemSpecType[],
	selected: ListItemSpecType[],
): ListType<Row> {
	return {
		type: 'list',
		key: 'k',
		enabled: false,
		spec: {title: 'Departments', options, selected, mode, displayTitle: true},
		apply: {key: 'x'},
	}
}

function dismiss() {
	fireEvent.press(screen.getByLabelText('Dismiss'))
}

describe('FilterSheet', () => {
	test('every option becomes a row', async () => {
		let options = [{title: 'A'}, {title: 'B'}, {title: 'C'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				isPresented={true}
				onChange={jest.fn()}
				onDismiss={jest.fn()}
			/>,
		)

		expect(screen.getByText('A')).toBeTruthy()
		expect(screen.getByText('B')).toBeTruthy()
		expect(screen.getByText('C')).toBeTruthy()
	})

	test('offers "Show All" in OR mode', async () => {
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterSheet
				filter={listFilter('OR', options, [])}
				isPresented={true}
				onChange={jest.fn()}
				onDismiss={jest.fn()}
			/>,
		)

		expect(screen.getByText('Show All')).toBeTruthy()
	})

	test('does not offer "Show All" in AND mode', async () => {
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				isPresented={true}
				onChange={jest.fn()}
				onDismiss={jest.fn()}
			/>,
		)

		expect(screen.queryByText('Show All')).toBeNull()
	})

	test('tapping a row then dismissing emits the filter toggleOption would produce', async () => {
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}, {title: 'C'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [{title: 'A'}])}
				isPresented={true}
				onChange={onChange}
				onDismiss={jest.fn()}
			/>,
		)

		await fireEvent.press(screen.getByText('B'))
		dismiss()

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				spec: expect.objectContaining({selected: [{title: 'A'}, {title: 'B'}]}),
			}),
		)
	})

	test('tapping "Show All" then dismissing emits the toggled-all selection', async () => {
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterSheet
				filter={listFilter('OR', options, [{title: 'A'}])}
				isPresented={true}
				onChange={onChange}
				onDismiss={jest.fn()}
			/>,
		)

		await fireEvent.press(screen.getByText('Show All'))
		dismiss()

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({spec: expect.objectContaining({selected: options})}),
		)
	})

	test('dismissing emits the accumulated filter once, not once per tap', async () => {
		let onChange = jest.fn()
		let onDismiss = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}, {title: 'C'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				isPresented={true}
				onChange={onChange}
				onDismiss={onDismiss}
			/>,
		)

		await fireEvent.press(screen.getByText('A'))
		await fireEvent.press(screen.getByText('B'))
		await fireEvent.press(screen.getByText('C'))

		expect(onChange).not.toHaveBeenCalled()

		dismiss()

		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onDismiss).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				spec: expect.objectContaining({selected: [{title: 'A'}, {title: 'B'}, {title: 'C'}]}),
			}),
		)
	})

	test('draws the icon iconFor returns, and nothing for options it returns null for', async () => {
		let options = [{title: 'A'}, {title: 'B'}]
		let iconFor = (option: ListItemSpecType): FilterIcon | null =>
			option.title === 'A' ? {kind: 'sfSymbol', name: 'leaf'} : null

		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				iconFor={iconFor}
				isPresented={true}
				onChange={jest.fn()}
				onDismiss={jest.fn()}
			/>,
		)

		expect(screen.getByLabelText('icon:sfSymbol:leaf')).toBeTruthy()
		expect(screen.queryAllByLabelText(/^icon:/u)).toHaveLength(1)
	})

	test('draws a local-file icon', async () => {
		let options = [{title: 'A'}]
		let iconFor = (): FilterIcon => ({kind: 'localFile', uri: 'file:///tmp/vegan.png'})

		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				iconFor={iconFor}
				isPresented={true}
				onChange={jest.fn()}
				onDismiss={jest.fn()}
			/>,
		)

		expect(screen.getByLabelText('icon:localFile:file:///tmp/vegan.png')).toBeTruthy()
	})

	test('renders nothing when there are no options', async () => {
		await render(
			<FilterSheet
				filter={listFilter('AND', [], [])}
				isPresented={true}
				onChange={jest.fn()}
				onDismiss={jest.fn()}
			/>,
		)

		expect(screen.toJSON()).toBeNull()
	})

	test('renders nothing when not presented', async () => {
		let options = [{title: 'A'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				isPresented={false}
				onChange={jest.fn()}
				onDismiss={jest.fn()}
			/>,
		)

		expect(screen.queryByText('A')).toBeNull()
	})
})
