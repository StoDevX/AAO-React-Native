import * as React from 'react'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

import EditScreen from '../../../../app/(home)/Dictionary/entry/edit'
import SenseScreen from '../../../../app/(home)/Dictionary/entry/sense'
import {normalizeEntry} from '../lib/entry'
import {useDictionaryDraftStore} from '../store'
import type * as ExpoRouterMock from '../../../testing/expo-router-mock'
import {simulateFocus} from '../../../testing/expo-router-mock'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

// Jest's mock hoisting forbids a `jest.mock()` factory from closing over an
// out-of-scope variable unless its name starts with "mock" -- the one
// exemption to the "no uninitialised mock variable" guard.
const mockPush = jest.fn()

jest.mock('expo-router', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	let {Stack, useFocusEffect}: typeof ExpoRouterMock = require('../../../testing/expo-router-mock')
	return {
		Stack,
		useFocusEffect,
		useRouter: () => ({push: mockPush}),
		useNavigation: () => ({goBack: jest.fn()}),
		useLocalSearchParams: () => ({senseId: '1'}),
	}
})
jest.mock('expo-router/react-navigation', () => ({usePreventRemove: jest.fn()}))

const entry = normalizeEntry({word: 'Caf', definition: 'The dining hall.'})

beforeEach(() => {
	mockPush.mockClear()
	useDictionaryDraftStore.getState().clearDraft()
})

describe('the dictionary edit screen', () => {
	it('says so when there is no draft to edit', async () => {
		await render(<EditScreen />)

		expect(screen.getByText(/nothing to edit/iu)).toBeTruthy()
	})

	it('seeds every field the viewer renders', async () => {
		useDictionaryDraftStore.getState().startDraft(
			normalizeEntry({
				word: 'Caf',
				pronunciation: 'kaf',
				partOfSpeech: 'noun',
				definition: 'The hall.',
			}),
		)
		await render(<EditScreen />)

		expect(screen.getByLabelText('Word').props.value).toBe('Caf')
		expect(screen.getByLabelText('Pronunciation').props.value).toBe('kaf')
		expect(screen.getByLabelText('Part of Speech').props.value).toBe('noun')
		expect(screen.getByLabelText('Definition 1').props.value).toBe('The hall.')
	})

	// The three headword fields are copy-paste shaped -- same `TextField`,
	// same `onTextChange={store.setX}` line -- which invites wiring one
	// field's `onTextChange` to a different field's setter. Checking only
	// each field's seeded `value` (above) would not catch that; a crossed
	// wire there still shows the right initial text.
	it("writes each headword field to its own store setter, not a neighbour's", async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		await fireEvent.changeText(screen.getByLabelText('Word'), 'Caff')
		await fireEvent.changeText(screen.getByLabelText('Pronunciation'), 'kaf')
		await fireEvent.changeText(screen.getByLabelText('Part of Speech'), 'noun')

		let draft = useDictionaryDraftStore.getState().draft
		expect(draft?.word).toBe('Caff')
		expect(draft?.pronunciation).toBe('kaf')
		expect(draft?.partOfSpeech).toBe('noun')
	})

	it('refuses to preview an untouched draft', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		expect(screen.getByLabelText('Preview').props.accessibilityState.disabled).toBe(true)
		expect(screen.getByText('No changes yet')).toBeTruthy()
	})

	it('offers the preview once something changed', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		await fireEvent.changeText(screen.getByLabelText('Definition 1'), 'The caf.')

		expect(screen.getByLabelText('Preview').props.accessibilityState.disabled).toBe(false)
		await fireEvent.press(screen.getByLabelText('Preview'))
		expect(mockPush).toHaveBeenCalledWith('/Dictionary/entry/preview')
	})

	// Regression: `sense.tsx` edits the same definition through its own field
	// while this screen stays mounted underneath it. A `useNativeState`
	// handle captures its initial value once on mount, so without a sync
	// pulling the row back into line, this row would keep showing whatever it
	// showed before the reader left for the sense screen -- see
	// `SenseDefinitionField` in `edit.tsx`.
	it("picks up a sense's definition changed elsewhere when it comes back to the front", async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		// Stands in for `sense.tsx`'s own Definition field calling this same
		// store action -- not a `fireEvent` on this screen's own row, which
		// would leave the handle and the store agreeing from the start and
		// never exercise the sync at all. Wrapped in `act` because, unlike
		// `fireEvent`, a direct store call is not wrapped for us.
		await act(() => {
			useDictionaryDraftStore.getState().setSenseField('1', {definition: 'Foo'})
		})
		await act(() => simulateFocus())

		expect(await screen.findByLabelText('Definition 1')).toHaveProperty('props.value', 'Foo')
	})

	// The other half of that sync, and the reason it hangs off focus rather
	// than off `sense.definition`: a store write landing while this screen is
	// the one in front belongs to a keystroke the reader just made here, and
	// the field already holds it. Writing the store's value back over the
	// field at that moment overwrites whatever arrived after the keystroke
	// being echoed -- on device that dropped characters out of the middle of
	// a typed word.
	it("leaves a sense's row alone while this screen is the one in front", async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		await act(() => {
			useDictionaryDraftStore.getState().setSenseField('1', {definition: 'Foo'})
		})

		expect(screen.getByLabelText('Definition 1')).toHaveProperty('props.value', 'The dining hall.')
	})

	it('adds a sense, and numbers the fields', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		await fireEvent.press(screen.getByText('Add Sense'))

		expect(screen.getByLabelText('Definition 2')).toBeTruthy()
	})

	it('offers no reorder toggle until there are two senses', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)
		expect(screen.queryByLabelText('Reorder')).toBeNull()

		await fireEvent.press(screen.getByText('Add Sense'))
		expect(screen.getByLabelText('Reorder')).toBeTruthy()
	})

	// `List.ForEach`'s drag gesture cannot run under Jest, but the mock still
	// forwards `onDelete`/`onMove` onto `testID="for-each"` so the wiring from
	// there into the store -- as opposed to the drag itself -- can be checked
	// here. A top-level sense in particular: the other coverage here only ever
	// deletes a sense nested under another one.
	it('deletes a top-level sense via the list handler', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().addSense()
		await render(<EditScreen />)

		fireEvent(screen.getByTestId('for-each'), 'onDelete', [0])

		// Asserting only the surviving length would still pass a handler that
		// deleted the wrong sense -- assert which one is left.
		expect(useDictionaryDraftStore.getState().draft?.senses.map((sense) => sense.id)).toEqual(['2'])
	})

	it('reorders senses via the list handler', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().addSense()
		let idsBefore = useDictionaryDraftStore.getState().draft?.senses.map((sense) => sense.id)
		await render(<EditScreen />)

		fireEvent(screen.getByTestId('for-each'), 'onMove', [0], 2)

		let idsAfter = useDictionaryDraftStore.getState().draft?.senses.map((sense) => sense.id)
		expect(idsAfter).toEqual([idsBefore?.[1], idsBefore?.[0]])
	})
})

describe('the dictionary sense screen', () => {
	it('says so when the sense has been deleted out from under it', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().deleteSense('1')
		await render(<SenseScreen />)

		expect(screen.getByText(/no longer part of this entry/iu)).toBeTruthy()
	})

	it('edits the sense its id names', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<SenseScreen />)

		await fireEvent.changeText(screen.getByLabelText('Grammar'), 'no object')

		expect(useDictionaryDraftStore.getState().draft?.senses[0].grammar).toBe('no object')
	})

	it('adds an example and edits it', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<SenseScreen />)

		await fireEvent.press(screen.getByText('Add Example'))
		await fireEvent.changeText(screen.getByLabelText('Example 1'), 'meet me at the caf')

		expect(useDictionaryDraftStore.getState().draft?.senses[0].examples[0].text).toBe(
			'meet me at the caf',
		)
	})

	it('adds a sub-sense under this sense', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<SenseScreen />)

		await fireEvent.press(screen.getByText('Add Sub-sense'))

		expect(useDictionaryDraftStore.getState().draft?.senses[0].subsenses).toHaveLength(1)
	})

	// As in the edit screen, the list handlers reach the store even though the
	// drag gesture that would trigger them on device cannot run here.
	it('deletes an example via the list handler', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().addExample('1')
		await render(<SenseScreen />)

		fireEvent(screen.getByTestId('for-each'), 'onDelete', [0])

		expect(useDictionaryDraftStore.getState().draft?.senses[0].examples).toHaveLength(0)
	})

	it('reorders examples via the list handler', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().addExample('1')
		useDictionaryDraftStore.getState().addExample('1')
		let idsBefore = useDictionaryDraftStore
			.getState()
			.draft?.senses[0].examples.map((example) => example.id)
		await render(<SenseScreen />)

		fireEvent(screen.getByTestId('for-each'), 'onMove', [0], 2)

		let idsAfter = useDictionaryDraftStore
			.getState()
			.draft?.senses[0].examples.map((example) => example.id)
		expect(idsAfter).toEqual([idsBefore?.[1], idsBefore?.[0]])
	})
})
