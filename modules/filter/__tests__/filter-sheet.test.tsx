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
	displayTitle = true,
): ListType<Row> {
	return {
		type: 'list',
		key: 'k',
		enabled: false,
		spec: {title: 'Departments', options, selected, mode, displayTitle},
		apply: {key: 'x'},
	}
}

async function dismiss() {
	await fireEvent.press(screen.getByLabelText('Dismiss'))
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
		await dismiss()

		// `enabled` is what actually makes a filter apply -- `toggleOption` sets
		// it to `result.length > 0` in `AND` mode, so it's part of what a tap
		// must produce, not just `selected`.
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				enabled: true,
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
		await dismiss()

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

		await dismiss()

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
		// Excludes the checkmark: nothing is selected in this fixture, so it
		// happens to pass without this exclusion, but the checkmark is drawn via
		// the same `Image` mock and carries the same `icon:` prefix
		// (`icon:sfSymbol:checkmark`) -- the exclusion is what makes this count
		// actually mean "option icons," not "option icons, so long as nothing
		// is selected."
		expect(screen.queryAllByLabelText(/^icon:(?!sfSymbol:checkmark)/u)).toHaveLength(1)
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

	test('reopening re-seeds from the incoming filter, and dismissing it again re-emits', async () => {
		// Neither the render-time re-seed (`:64-70`) nor the effect that resets
		// the emit guard on open (`:72-76`) is exercised by a single
		// open-then-dismiss -- deleting either still leaves every other test
		// green. This drives a second presentation to cover both: the reopened
		// sheet must reflect `secondFilter`, not the first presentation's
		// selections, and its own dismissal must emit on its own, not be a
		// silent no-op left over from the first guard.
		let onChange = jest.fn()
		let onDismiss = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}]
		let firstFilter = listFilter('AND', options, [{title: 'A'}])
		let secondFilter = listFilter('AND', options, [{title: 'B'}])

		let {rerender} = await render(
			<FilterSheet
				filter={firstFilter}
				isPresented={true}
				onChange={onChange}
				onDismiss={onDismiss}
			/>,
		)

		await dismiss()
		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({spec: expect.objectContaining({selected: [{title: 'A'}]})}),
		)

		await rerender(
			<FilterSheet
				filter={firstFilter}
				isPresented={false}
				onChange={onChange}
				onDismiss={onDismiss}
			/>,
		)
		await rerender(
			<FilterSheet
				filter={secondFilter}
				isPresented={true}
				onChange={onChange}
				onDismiss={onDismiss}
			/>,
		)

		await dismiss()

		expect(onChange).toHaveBeenCalledTimes(2)
		expect(onDismiss).toHaveBeenCalledTimes(2)
		expect(onChange).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({spec: expect.objectContaining({selected: [{title: 'B'}]})}),
		)
	})

	test('displayTitle false renders by label, not title', async () => {
		let options = [{title: 'BIO', label: 'Biology'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [], false)}
				isPresented={true}
				onChange={jest.fn()}
				onDismiss={jest.fn()}
			/>,
		)

		expect(screen.getByText('Biology')).toBeTruthy()
		expect(screen.queryByText('BIO')).toBeNull()
	})
})
