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
	it('names the part of speech', async () => {
		await render(<EntryDefinition entry={entry} />)

		expect(screen.getByText('noun')).toBeTruthy()
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
