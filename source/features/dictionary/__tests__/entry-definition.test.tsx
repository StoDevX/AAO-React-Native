import * as React from 'react'
import {render, screen} from '@testing-library/react-native'

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

const entry = normalizeEntry({
	word: 'Caf',
	pronunciation: 'kaf',
	partOfSpeech: 'noun',
	senses: [{definition: 'The dining hall.', examples: ['meet me at the caf']}],
})

describe('EntryDefinition', () => {
	it('renders the headword, its phonetics and its part of speech', async () => {
		await render(<EntryDefinition entry={entry} />)

		expect(screen.getByText('Caf')).toBeTruthy()
		expect(screen.getByText('| kaf |')).toBeTruthy()
		expect(screen.getByText('noun')).toBeTruthy()
	})

	it('numbers each sense', async () => {
		let two = normalizeEntry({
			word: 'ACM',
			senses: [{definition: 'The association.'}, {definition: 'The chapter.'}],
		})
		await render(<EntryDefinition entry={two} />)

		expect(screen.getByText('1')).toBeTruthy()
		expect(screen.getByText('2')).toBeTruthy()
	})

	it('offers no chrome of its own — the route owns the title and the actions', async () => {
		await render(<EntryDefinition entry={entry} />)

		expect(screen.queryByLabelText('More actions')).toBeNull()
		expect(screen.queryByLabelText('Close')).toBeNull()
	})

	it('shows the headword and its only sense', async () => {
		await render(
			<EntryDefinition entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})} />,
		)

		expect(screen.getByText('Caf')).toBeTruthy()
		expect(screen.getByText('The dining hall.')).toBeTruthy()
	})

	it('numbers a lone sense too, so it reads as an entry not a paragraph', async () => {
		await render(
			<EntryDefinition entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})} />,
		)

		expect(screen.getByText('1')).toBeTruthy()
	})

	it('numbers every sense when there are several', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({
					word: 'ACM',
					senses: [{definition: 'The association.'}, {definition: 'The student chapter.'}],
				})}
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
			/>,
		)

		expect(screen.getByText('| ˈɪtərboʊ |')).toBeTruthy()
	})

	it('omits the pronunciation line entirely when there is none', async () => {
		await render(
			<EntryDefinition entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})} />,
		)

		expect(screen.queryByText(/\|/u)).toBeNull()
	})

	it('shows an example when a sense carries one', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({
					word: 'Pause',
					senses: [{definition: 'The venue.', examples: ['Grab mozzarella sticks.']}],
				})}
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
					senses: [{definition: 'The venue.', examples: ['Grab a snack.']}],
				})}
			/>,
		)

		expect(screen.getByText('The venue')).toBeTruthy()
		expect(screen.queryByText('The venue.')).toBeNull()
	})

	it('keeps the full stop when the sense has no example', async () => {
		await render(
			<EntryDefinition entry={normalizeEntry({word: 'Caf', definition: 'The dining hall.'})} />,
		)

		expect(screen.getByText('The dining hall.')).toBeTruthy()
	})

	it('brackets a grammar label ahead of the definition', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({
					word: 'change',
					senses: [{grammar: 'with object', definition: 'alter or modify.'}],
				})}
			/>,
		)

		expect(screen.getByText('[with object] ')).toBeTruthy()
	})

	it('divides several citations with a vertical bar', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({
					word: 'change',
					senses: [{definition: 'alter or modify.', examples: ['first one', 'second one.']}],
				})}
			/>,
		)

		expect(screen.getByText(': first one | second one.')).toBeTruthy()
	})

	it('marks a sub-sense with a bullet rather than a number', async () => {
		await render(
			<EntryDefinition
				entry={normalizeEntry({
					word: 'change',
					senses: [
						{
							definition: 'alter or modify.',
							subsenses: [{definition: 'become different.'}],
						},
					],
				})}
			/>,
		)

		expect(screen.getByText('1')).toBeTruthy()
		expect(screen.getByText('•')).toBeTruthy()
		expect(screen.getByText('become different.')).toBeTruthy()
	})
})
