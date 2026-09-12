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

	it('gives every section a jumplist letter matching its title', async () => {
		await renderList()

		expect(screen.getByLabelText('section index C')).toBeTruthy()
		expect(screen.getByLabelText('section index P')).toBeTruthy()
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

	it('retries from the error branch', async () => {
		// oxlint-disable-next-line require-await
		let onRetry = jest.fn(async () => undefined)
		await renderList({isError: true, onRetry})

		await fireEvent.press(screen.getByText('Try Again'))

		expect(onRetry).toHaveBeenCalled()
	})

	it('keeps the pull-to-refresh handler pending until onRetry settles', async () => {
		let resolveRetry!: () => void
		let retryPromise = new Promise<void>((resolve) => {
			resolveRetry = resolve
		})
		let onRetry = jest.fn(() => retryPromise)
		await renderList({onRetry})

		// Read straight off the rendered element rather than going through
		// `fireEvent`, which would adopt the handler's own returned promise
		// as its result and hang here until onRetry settles.
		let refresh = screen.getByTestId('refreshable').props.onRefresh as () => Promise<void>

		let settled = false
		refresh().then(() => {
			settled = true
		})

		// The handler calls onRetry synchronously, before its first await.
		expect(onRetry).toHaveBeenCalled()

		// Let already-resolved microtasks run without resolving onRetry, so a
		// handler that forgets to await onRetry would already show settled
		// here instead of only after resolveRetry runs below.
		await Promise.resolve()
		await Promise.resolve()
		expect(settled).toBe(false)

		resolveRetry()
		await Promise.resolve()
		await Promise.resolve()
		expect(settled).toBe(true)
	})
})
