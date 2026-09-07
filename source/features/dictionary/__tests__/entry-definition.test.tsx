import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {EntryDefinition} from '../entry-definition'
import {normalizeEntry} from '../lib/entry'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

describe('EntryDefinition', () => {
	it('shows the headword and its only sense', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})}
				onClose={jest.fn()}
				onEdit={jest.fn()}
			/>,
		)

		expect(screen.getByText('Caf')).toBeTruthy()
		expect(screen.getByText('The dining hall.')).toBeTruthy()
	})

	it('numbers senses only when there is more than one', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})}
				onClose={jest.fn()}
				onEdit={jest.fn()}
			/>,
		)

		expect(screen.queryByText('1')).toBeNull()
	})

	it('numbers every sense when there are several', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({
					word: 'ACM',
					senses: [{definition: 'The association.'}, {definition: 'The student chapter.'}],
				})}
				onClose={jest.fn()}
				onEdit={jest.fn()}
			/>,
		)

		expect(screen.getByText('1')).toBeTruthy()
		expect(screen.getByText('2')).toBeTruthy()
	})

	it('brackets the pronunciation the way a dictionary does', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({
					word: 'Ytterboe',
					pronunciation: 'ˈɪtərboʊ',
					definition: 'A residence hall.',
				})}
				onClose={jest.fn()}
				onEdit={jest.fn()}
			/>,
		)

		expect(screen.getByText('| ˈɪtərboʊ |')).toBeTruthy()
	})

	it('omits the pronunciation line entirely when there is none', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})}
				onClose={jest.fn()}
				onEdit={jest.fn()}
			/>,
		)

		expect(screen.queryByText(/\|/u)).toBeNull()
	})

	it('shows an example when a sense carries one', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({
					word: 'Pause',
					senses: [{definition: 'The venue.', example: 'Grab mozzarella sticks.'}],
				})}
				onClose={jest.fn()}
				onEdit={jest.fn()}
			/>,
		)

		// The example runs on from its definition after a colon, so it is not a
		// standalone string in the tree.
		expect(screen.getByText(': Grab mozzarella sticks.')).toBeTruthy()
	})

	it('drops the definition’s full stop before an example runs on from it', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({
					word: 'Pause',
					senses: [{definition: 'The venue.', example: 'Grab a snack.'}],
				})}
				onClose={jest.fn()}
				onEdit={jest.fn()}
			/>,
		)

		expect(screen.getByText('The venue')).toBeTruthy()
		expect(screen.queryByText('The venue.')).toBeNull()
	})

	it('keeps the full stop when the sense has no example', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})}
				onClose={jest.fn()}
				onEdit={jest.fn()}
			/>,
		)

		expect(screen.getByText('The dining hall.')).toBeTruthy()
	})

	it('reports a request to edit', async () => {
		let onEdit = jest.fn()
		await render(
			<EntryDefinition
				entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})}
				onClose={jest.fn()}
				onEdit={onEdit}
			/>,
		)

		await fireEvent.press(screen.getByText('Suggest an Edit'))

		expect(onEdit).toHaveBeenCalled()
	})

	it('reports a request to close', async () => {
		let onClose = jest.fn()
		await render(
			<EntryDefinition
				entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})}
				onClose={onClose}
				onEdit={jest.fn()}
			/>,
		)

		await fireEvent.press(screen.getByLabelText('Close'))

		expect(onClose).toHaveBeenCalled()
	})
})
