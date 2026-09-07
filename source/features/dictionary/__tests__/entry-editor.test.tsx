import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {EntryEditor} from '../entry-editor'
import {normalizeEntry} from '../lib/entry'
import {submitReport} from '../report/submit'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('../report/submit', () => ({submitReport: jest.fn()}))

const mockSubmit = jest.mocked(submitReport)

afterEach(() => {
	mockSubmit.mockClear()
})

const entry = normalizeEntry({word: 'Caf', definition: 'The dining hall.'})

describe('EntryEditor', () => {
	it('seeds both fields from the entry', async () => {
		await render(<EntryEditor entry={entry} onDone={jest.fn()} />)

		expect(screen.getByLabelText('Word')).toBeTruthy()
		expect(screen.getByLabelText('Definition')).toBeTruthy()
	})

	it('joins several senses into one definition field', async () => {
		let multi = normalizeEntry({
			word: 'ACM',
			senses: [{definition: 'The association.'}, {definition: 'The chapter.'}],
		})

		await render(<EntryEditor entry={multi} onDone={jest.fn()} />)
		await fireEvent.press(screen.getByText('Submit Report'))

		expect(mockSubmit).toHaveBeenCalledWith(
			expect.objectContaining({word: 'ACM'}),
			expect.objectContaining({definition: 'The association.\n\nThe chapter.'}),
		)
	})

	it('carries sub-senses into the field a reader edits', async () => {
		let nested = normalizeEntry({
			word: 'change',
			senses: [{definition: 'alter or modify.', subsenses: [{definition: 'become different.'}]}],
		})

		await render(<EntryEditor entry={nested} onDone={jest.fn()} />)
		await fireEvent.press(screen.getByText('Submit Report'))

		expect(mockSubmit).toHaveBeenCalledWith(
			expect.objectContaining({word: 'change'}),
			expect.objectContaining({definition: 'alter or modify.\n\nbecome different.'}),
		)
	})

	it('submits the edited text, trimmed', async () => {
		await render(<EntryEditor entry={entry} onDone={jest.fn()} />)

		await fireEvent.changeText(screen.getByLabelText('Definition'), '  The caf.  ')
		await fireEvent.press(screen.getByText('Submit Report'))

		expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({word: 'Caf'}), {
			word: 'Caf',
			definition: 'The caf.',
		})
	})

	it('closes itself after submitting', async () => {
		let onDone = jest.fn()
		await render(<EntryEditor entry={entry} onDone={onDone} />)

		await fireEvent.press(screen.getByText('Submit Report'))

		expect(onDone).toHaveBeenCalled()
	})

	it('reports the original entry in its stored sense form', async () => {
		await render(<EntryEditor entry={entry} onDone={jest.fn()} />)
		await fireEvent.press(screen.getByText('Submit Report'))

		expect(mockSubmit.mock.calls[0]?.[0]).toEqual({
			word: 'Caf',
			senses: [{definition: 'The dining hall.'}],
		})
	})
})
