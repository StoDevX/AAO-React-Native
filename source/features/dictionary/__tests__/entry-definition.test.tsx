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
})
