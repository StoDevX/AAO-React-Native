import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {EntryList} from '../entry-list'
import {groupEntries, normalizeEntry} from '../lib/entry'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const entries = [
	normalizeEntry({word: 'Caf', definition: 'The dining hall.'}),
	normalizeEntry({word: 'Pause', definition: 'The student-run venue.'}),
]

function renderList(overrides: Partial<React.ComponentProps<typeof EntryList>> = {}) {
	return render(
		<EntryList
			groups={groupEntries(entries)}
			isError={false}
			isLoading={false}
			// oxlint-disable-next-line require-await
			onRetry={jest.fn(async () => undefined)}
			// oxlint-disable-next-line require-await
			onSelect={jest.fn(async () => undefined)}
			query=""
			{...overrides}
		/>,
	)
}

describe('EntryList', () => {
	it('lists every entry under its letter', async () => {
		await renderList()

		expect(screen.getByText('C')).toBeTruthy()
		expect(screen.getByText('Caf')).toBeTruthy()
		expect(screen.getByText('P')).toBeTruthy()
		expect(screen.getByText('Pause')).toBeTruthy()
	})

	it('shows the first sense as each row’s preview', async () => {
		await renderList()

		expect(screen.getByText('The dining hall.')).toBeTruthy()
	})

	it('reports the tapped entry', async () => {
		let onSelect = jest.fn()
		await renderList({onSelect})

		await fireEvent.press(screen.getByText('Caf'))

		expect(onSelect).toHaveBeenCalledWith(entries[0])
	})

	it('chooses the error branch over the list', async () => {
		await renderList({isError: true})

		expect(screen.getByText('Couldn’t load the dictionary')).toBeTruthy()
		expect(screen.queryByText('Caf')).toBeNull()
	})

	it('retries from the error branch', async () => {
		// oxlint-disable-next-line require-await
		let onRetry = jest.fn(async () => undefined)
		await renderList({isError: true, onRetry})

		await fireEvent.press(screen.getByText('Try Again'))

		expect(onRetry).toHaveBeenCalled()
	})

	it('names the query in the no-results branch', async () => {
		await renderList({groups: [], query: 'zzz'})

		expect(screen.getByText('No results for “zzz”')).toBeTruthy()
	})

	it('chooses the loading branch over the empty branch', async () => {
		await renderList({groups: [], isLoading: true})

		expect(screen.getByLabelText('Loading')).toBeTruthy()
		expect(screen.queryByText('No results')).toBeNull()
	})

	it('prefers the error branch to the loading branch', async () => {
		await renderList({groups: [], isError: true, isLoading: true})

		expect(screen.getByText('Couldn’t load the dictionary')).toBeTruthy()
		expect(screen.queryByLabelText('Loading')).toBeNull()
	})
})
