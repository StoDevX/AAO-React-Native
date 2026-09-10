import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import EntryScreen from '../../../../app/(home)/Dictionary/entry/[word]'
import {keys} from '../query'
import {useDictionaryDraftStore} from '../store'
import type {WordType} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
	Stack: Object.assign(({children}: {children?: React.ReactNode}) => children ?? null, {
		Title: () => null,
		Toolbar: Object.assign(({children}: {children?: React.ReactNode}) => children ?? null, {
			Menu: ({children}: {children?: React.ReactNode}) => children ?? null,
			MenuAction: (props: {onPress: () => void; children?: React.ReactNode}) => {
				// oxlint-disable-next-line typescript/no-require-imports
				let {Pressable, Text} = require('react-native')
				return (
					<Pressable onPress={props.onPress}>
						<Text>{props.children}</Text>
					</Pressable>
				)
			},
		}),
	}),
	useLocalSearchParams: () => ({word: 'Caf'}),
	useRouter: () => ({push: mockPush}),
}))

const wordEntry: WordType = {word: 'Caf', definition: 'The dining hall.'}

// Every query left without observers gets a garbage-collection timeout, and
// React Query's default is five minutes -- long enough to outlive the run and
// leave the Jest worker to be force-killed rather than exiting on its own.
// See the identical comment in ../../faqs/__tests__/banner.test.tsx.
const trackedQueryClients: QueryClient[] = []

const renderWithQuery = (words: WordType[]) => {
	let queryClient = new QueryClient({
		defaultOptions: {queries: {retry: false, staleTime: Infinity}},
	})
	queryClient.setQueryData(keys.all, words)
	trackedQueryClients.push(queryClient)
	return render(
		<QueryClientProvider client={queryClient}>
			<EntryScreen />
		</QueryClientProvider>,
	)
}

beforeEach(() => {
	mockPush.mockClear()
	useDictionaryDraftStore.getState().clearDraft()
})

afterEach(() => {
	for (let queryClient of trackedQueryClients) {
		queryClient.clear()
	}
	trackedQueryClients.length = 0
})

describe('the dictionary entry screen', () => {
	it('starts a draft from the entry on screen and pushes to the edit form', async () => {
		await renderWithQuery([wordEntry])

		await fireEvent.press(await screen.findByText('Suggest an Edit'))

		expect(useDictionaryDraftStore.getState().original).toEqual({
			word: 'Caf',
			senses: [{definition: 'The dining hall.'}],
		})
		expect(mockPush).toHaveBeenCalledWith('/Dictionary/entry/edit')
	})

	it('does nothing if the menu action fires with no entry to start a draft from', async () => {
		// The toolbar menu renders in the loading and not-found branches too,
		// where there is nothing yet to seed a draft with. An empty word list
		// reaches the not-found branch, which exercises the same guard.
		await renderWithQuery([])

		await fireEvent.press(await screen.findByText('Suggest an Edit'))

		expect(useDictionaryDraftStore.getState().original).toBeNull()
		expect(mockPush).not.toHaveBeenCalled()
	})
})
