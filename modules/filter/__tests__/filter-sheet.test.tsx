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

// Matches every `listFilter` fixture below -- the sheet's presentation is its
// own state, so every test has to open it via this exact label before it can
// see or tap a row.
const TITLE = 'Departments'

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
		spec: {title: TITLE, options, selected, mode, displayTitle},
		apply: {key: 'x'},
	}
}

async function openSheet() {
	await fireEvent.press(screen.getByRole('button', {name: TITLE}))
}

async function dismiss() {
	await fireEvent.press(screen.getByLabelText('Dismiss'))
}

describe('FilterSheet', () => {
	test('renders its own trigger button, unopened, before any row is visible', async () => {
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				isActive={false}
				onChange={jest.fn()}
				title={TITLE}
			/>,
		)

		expect(screen.getByRole('button', {name: TITLE})).toBeTruthy()
		expect(screen.queryByText('A')).toBeNull()
	})

	// Compared by identity against `filter-menu.tsx`'s own exported constants,
	// not a literal shape, so the mock's invented `Modifier` representation
	// can't leak into what this asserts -- the same discipline
	// `filter-menu.test.tsx` uses for `Menu`'s trigger.
	test('every option becomes a row once opened', async () => {
		let options = [{title: 'A'}, {title: 'B'}, {title: 'C'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				isActive={false}
				onChange={jest.fn()}
				title={TITLE}
			/>,
		)

		await openSheet()

		expect(screen.getByText('A')).toBeTruthy()
		expect(screen.getByText('B')).toBeTruthy()
		expect(screen.getByText('C')).toBeTruthy()
	})

	// "Clear" tracks whether there is a selection to clear, not which mode the
	// filter is in -- an empty filter is already showing everything.
	test.each(['AND', 'OR'] as const)(
		'offers "Clear" in %s mode once anything is selected',
		async (mode) => {
			let options = [{title: 'A'}, {title: 'B'}]
			await render(
				<FilterSheet
					filter={listFilter(mode, options, [{title: 'A'}])}
					isActive={true}
					onChange={jest.fn()}
					title={TITLE}
				/>,
			)

			await openSheet()

			expect(screen.getByText('Clear')).toBeTruthy()
		},
	)

	test.each(['AND', 'OR'] as const)(
		'offers no "Clear" in %s mode when nothing is selected',
		async (mode) => {
			let options = [{title: 'A'}, {title: 'B'}]
			await render(
				<FilterSheet
					filter={listFilter(mode, options, [])}
					isActive={false}
					onChange={jest.fn()}
					title={TITLE}
				/>,
			)

			await openSheet()

			expect(screen.queryByText('Clear')).toBeNull()
		},
	)

	test('tapping a row then dismissing emits the filter toggleOption would produce', async () => {
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}, {title: 'C'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [{title: 'A'}])}
				isActive={false}
				onChange={onChange}
				title={TITLE}
			/>,
		)

		await openSheet()
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

	test('tapping "Clear" then dismissing emits the emptied, disabled filter', async () => {
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterSheet
				filter={listFilter('OR', options, [{title: 'A'}])}
				isActive={true}
				onChange={onChange}
				title={TITLE}
			/>,
		)

		await openSheet()
		await fireEvent.press(screen.getByText('Clear'))
		await dismiss()

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({enabled: false, spec: expect.objectContaining({selected: []})}),
		)
	})

	test('dismissing emits the accumulated filter once, not once per tap, and closes the sheet', async () => {
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}, {title: 'C'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				isActive={false}
				onChange={onChange}
				title={TITLE}
			/>,
		)

		await openSheet()
		await fireEvent.press(screen.getByText('A'))
		await fireEvent.press(screen.getByText('B'))
		await fireEvent.press(screen.getByText('C'))

		expect(onChange).not.toHaveBeenCalled()

		await dismiss()

		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				spec: expect.objectContaining({selected: [{title: 'A'}, {title: 'B'}, {title: 'C'}]}),
			}),
		)
		// The dismiss closed the sheet -- the rows it just tapped are gone, and
		// only the trigger remains. The sheet owns `isPresented` itself, so the
		// closed rows are the only outside signal a test has.
		expect(screen.queryByText('A')).toBeNull()
		expect(screen.getByRole('button', {name: TITLE})).toBeTruthy()
	})

	test('draws the icon iconFor returns, and nothing for options it returns null for', async () => {
		let options = [{title: 'A'}, {title: 'B'}]
		let iconFor = (option: ListItemSpecType): FilterIcon | null =>
			option.title === 'A' ? {kind: 'sfSymbol', name: 'leaf'} : null

		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				iconFor={iconFor}
				isActive={false}
				onChange={jest.fn()}
				title={TITLE}
			/>,
		)

		await openSheet()

		// The branch is what matters: an option `iconFor` answers for draws its
		// icon, one it returns null for draws none. Asserting the two named
		// icons rather than counting every `Image` on screen keeps the sheet's
		// own chrome -- the close glyph, the trigger's chevron -- out of it.
		expect(screen.getByLabelText('icon:sfSymbol:leaf')).toBeTruthy()
		expect(screen.queryByLabelText('icon:sfSymbol:null')).toBeNull()
	})

	test('renders nothing when there are no options', async () => {
		await render(
			<FilterSheet
				filter={listFilter('AND', [], [])}
				isActive={false}
				onChange={jest.fn()}
				title={TITLE}
			/>,
		)

		expect(screen.toJSON()).toBeNull()
	})

	test('reopening re-seeds from the incoming filter, and dismissing it again re-emits', async () => {
		// A single open-then-dismiss can't tell `openSheet`'s `setLocal(filter)`
		// seed and the emit guard's reset apart from having no effect at all.
		// This drives a second presentation to prove both actually happen: the
		// reopened sheet must reflect `secondFilter`, not the first
		// presentation's selections, and its own dismissal must emit on its own,
		// not stay silent because of the first guard.
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}]
		let firstFilter = listFilter('AND', options, [{title: 'A'}])
		let secondFilter = listFilter('AND', options, [{title: 'B'}])

		let {rerender} = await render(
			<FilterSheet filter={firstFilter} isActive={false} onChange={onChange} title={TITLE} />,
		)

		await openSheet()
		await dismiss()
		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({spec: expect.objectContaining({selected: [{title: 'A'}]})}),
		)

		// `filter` changing while the sheet sits closed -- the parent applying
		// some other update -- must not leak into the next presentation.
		await rerender(
			<FilterSheet filter={secondFilter} isActive={false} onChange={onChange} title={TITLE} />,
		)

		await openSheet()
		await dismiss()

		expect(onChange).toHaveBeenCalledTimes(2)
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
				isActive={false}
				onChange={jest.fn()}
				title={TITLE}
			/>,
		)

		await openSheet()

		expect(screen.getByText('Biology')).toBeTruthy()
		expect(screen.queryByText('BIO')).toBeNull()
	})

	test('draws its own title in the header once opened, alongside the still-mounted anchor', async () => {
		await render(
			<FilterSheet
				filter={listFilter('AND', [{title: 'A'}], [])}
				isActive={false}
				onChange={jest.fn()}
				title={TITLE}
			/>,
		)

		// Before the sheet opens, only the anchor trigger draws the title.
		expect(screen.getAllByText(TITLE)).toHaveLength(1)

		await openSheet()

		// The header adds a second occurrence -- the sheet's own title -- while
		// the anchor `Button` stays mounted underneath it (see `BottomSheet`'s
		// mock doc comment).
		expect(screen.getAllByText(TITLE)).toHaveLength(2)
	})

	test('the close button commits the accumulated filter, exactly like a swipe does', async () => {
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				isActive={false}
				onChange={onChange}
				title={TITLE}
			/>,
		)

		await openSheet()
		await fireEvent.press(screen.getByText('A'))
		await fireEvent.press(screen.getByRole('button', {name: 'Close'}))

		// The X commits `local`, not a discard path -- a swipe already applies
		// the user's selections, so the two dismissal gestures have to agree.
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({spec: expect.objectContaining({selected: [{title: 'A'}]})}),
		)
		// It closes the sheet too, the same as a swipe: the row it just tapped is
		// gone, and only the anchor remains.
		expect(screen.queryByText('B')).toBeNull()
		expect(screen.getByRole('button', {name: TITLE})).toBeTruthy()
	})

	test('offers "Clear" in the header, not as a row', async () => {
		let options = [{title: 'A'}, {title: 'B'}]
		let onChange = jest.fn()
		await render(
			<FilterSheet
				filter={listFilter('OR', options, [{title: 'A'}])}
				isActive={true}
				onChange={onChange}
				title={TITLE}
			/>,
		)

		await openSheet()

		let clear = screen.getByRole('button', {name: 'Clear'})
		await fireEvent.press(clear)
		await fireEvent.press(screen.getByRole('button', {name: 'Close'}))

		// It drives `clearSelection`, so the emitted filter is empty and off --
		// the header button is wired to the rule, not a re-implementation of it.
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({enabled: false, spec: expect.objectContaining({selected: []})}),
		)
	})

	test('renders an option detail beneath its label', async () => {
		let options = [{title: 'Vegan', detail: 'Contains no animal products'}]
		await render(
			<FilterSheet
				filter={listFilter('AND', options, [])}
				isActive={false}
				onChange={jest.fn()}
				title={TITLE}
			/>,
		)

		await openSheet()

		expect(screen.getByText('Vegan')).toBeTruthy()
		expect(screen.getByText('Contains no animal products')).toBeTruthy()
	})
})
