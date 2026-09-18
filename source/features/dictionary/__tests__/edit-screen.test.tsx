import * as React from 'react'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

import EditScreen from '../../../../app/(home)/Dictionary/entry/edit'
import SenseScreen from '../../../../app/(home)/Dictionary/entry/sense'
import {normalizeEntry} from '../lib/entry'
import {useDictionaryDraftStore} from '../store'
import type * as ExpoRouterMock from '../../../testing/expo-router-mock'

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
	let {Stack}: typeof ExpoRouterMock = require('../../../testing/expo-router-mock')
	return {
		Stack,
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

	// Clearing the last definition *is* a change, so a Preview keyed off
	// `hasChanges` alone would offer to send `word: Caf` and nothing else. The
	// footer is the only place the form can say why the button went quiet.
	//
	// The definition is cleared through the store, as `sense.tsx`'s own field
	// does -- this screen has no definition field of its own to fire on.
	it('refuses to preview a draft left with no definition', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		await act(() => {
			useDictionaryDraftStore.getState().setSenseField('1', {definition: ''})
		})

		expect(screen.getByLabelText('Preview').props.accessibilityState.disabled).toBe(true)
		expect(screen.getByText('Add a definition to preview')).toBeTruthy()
	})

	it('offers the preview once something changed', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		await act(() => {
			useDictionaryDraftStore.getState().setSenseField('1', {definition: 'The caf.'})
		})

		expect(screen.getByLabelText('Preview').props.accessibilityState.disabled).toBe(false)

		// The footer stays mounted either way, so only its wording says which
		// state the draft is in -- assert both halves, or a footer stuck on
		// "No changes yet" reads as untouched next to an enabled Preview.
		expect(screen.queryByText('No changes yet')).toBeNull()
		expect(screen.getByText('Ready to preview')).toBeTruthy()

		await fireEvent.press(screen.getByLabelText('Preview'))
		expect(mockPush).toHaveBeenCalledWith('/Dictionary/entry/preview')
	})

	// A sense added here has nowhere on this screen to be typed into, so the
	// button that adds it is also the one that opens it.
	it('adds a sense and opens it', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		await fireEvent.press(screen.getByText('Add Sense'))

		let added = useDictionaryDraftStore.getState().draft?.senses.at(-1)
		expect(added).toBeTruthy()
		expect(mockPush).toHaveBeenCalledWith({
			pathname: '/Dictionary/entry/sense',
			params: {senseId: added?.id},
		})
	})

	it("shows each sense's definition as its row", async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		expect(screen.getByText('The dining hall.')).toBeTruthy()
	})

	// A row hard-coded to the draft it was seeded with would pass the test
	// above too -- this is what tells the row apart from a static label.
	it("updates a sense's row when its definition changes elsewhere", async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		await act(() => {
			useDictionaryDraftStore.getState().setSenseField('1', {definition: 'Foo'})
		})

		expect(screen.getByText('Foo')).toBeTruthy()
	})

	// A sense with nothing in it yet would otherwise render a row with no
	// text at all -- a chevron floating over blank space, with nothing saying
	// which sense it opens.
	it('names a sense with no definition by its number', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().addSense()
		await render(<EditScreen />)

		expect(screen.getByText('Sense 2')).toBeTruthy()
	})

	it('opens the sense a row names', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<EditScreen />)

		await fireEvent.press(screen.getByText('The dining hall.'))

		expect(mockPush).toHaveBeenCalledWith({
			pathname: '/Dictionary/entry/sense',
			params: {senseId: '1'},
		})
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

	// Three senses, not two: `onMove`'s destination counts positions in the
	// list before the dragged row is lifted out, and in a two-item list a
	// downward drag lands last under that reading and under a plain splice
	// alike -- so a two-item list cannot tell a correct handler from one that
	// drops the sense a place too far.
	it('reorders senses via the list handler', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().addSense()
		useDictionaryDraftStore.getState().addSense()
		let idsBefore = useDictionaryDraftStore.getState().draft?.senses.map((sense) => sense.id)
		await render(<EditScreen />)

		fireEvent(screen.getByTestId('for-each'), 'onMove', [0], 2)

		let idsAfter = useDictionaryDraftStore.getState().draft?.senses.map((sense) => sense.id)
		expect(idsAfter).toEqual([idsBefore?.[1], idsBefore?.[0], idsBefore?.[2]])
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

	// Like Add Sense on the edit form, the button that appends a sub-sense is
	// also the one that opens it -- its row carries no field to type into.
	it('adds a sub-sense under this sense and opens it', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		await render(<SenseScreen />)

		await fireEvent.press(screen.getByText('Add Sub-sense'))

		let added = useDictionaryDraftStore.getState().draft?.senses[0].subsenses.at(-1)
		expect(added).toBeTruthy()
		expect(mockPush).toHaveBeenCalledWith({
			pathname: '/Dictionary/entry/sense',
			params: {senseId: added?.id},
		})
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

	// Three examples for the same reason the sense reorder above uses three
	// senses: two rows cannot distinguish a downward drag that lands second
	// from one that lands last.
	it('reorders examples via the list handler', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().addExample('1')
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
		expect(idsAfter).toEqual([idsBefore?.[1], idsBefore?.[0], idsBefore?.[2]])
	})
})
