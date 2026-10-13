import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import EntryScreen from '../../../../app/dictionary/entry/[word]'
import {keys} from '../query'
import {useCampusStore} from '../../campus/store'
import type {CampusId} from '../../../campuses'
import {useDictionaryDraftStore} from '../store'
import type {WordType} from '../types'

const mockNavigate = jest.fn()

jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	Stack: require('../../../testing/expo-router-mock').Stack,
	useLocalSearchParams: () => ({word: 'Caf'}),
	useNavigation: () => ({goBack: jest.fn()}),
	useRouter: () => ({navigate: mockNavigate}),
}))

// Every campus's dictionary takes suggestions; one that took none is stood in for here.
let mockRefusesSuggestions = false
jest.mock('../../campus/store', () => {
	let actual = jest.requireActual('../../campus/store') as typeof import('../../campus/store')
	return {
		...actual,
		useCampusSection: (key: Parameters<typeof actual.useCampusSection>[0]) => {
			let section = actual.useCampusSection(key)
			return key === 'dictionary' && mockRefusesSuggestions && section
				? {...(section as object), acceptsSuggestions: false}
				: section
		},
	}
})

const wordEntry: WordType = {word: 'Caf', definition: 'The dining hall.'}

// Every query left without observers gets a garbage-collection timeout, and
// React Query's default is five minutes -- long enough to outlive the run and
// leave the Jest worker to be force-killed rather than exiting on its own.
// See the identical comment in ../../faqs/__tests__/banner.test.tsx.
const trackedQueryClients: QueryClient[] = []

const renderWithQuery = (words: WordType[], server: CampusId = 'edu.stolaf') => {
	let queryClient = new QueryClient({
		defaultOptions: {queries: {retry: false, staleTime: Infinity}},
	})
	queryClient.setQueryData(keys.forServer(server), words)
	trackedQueryClients.push(queryClient)
	return render(
		<QueryClientProvider client={queryClient}>
			<EntryScreen />
		</QueryClientProvider>,
	)
}

beforeEach(() => {
	useCampusStore.setState({campus: 'edu.stolaf'})
	mockRefusesSuggestions = false
	mockNavigate.mockClear()
	useDictionaryDraftStore.getState().clearDraft()
})

afterEach(() => {
	for (let queryClient of trackedQueryClients) {
		queryClient.clear()
	}
	trackedQueryClients.length = 0
})

describe('the dictionary entry screen', () => {
	it('offers no Suggest an Edit where the dictionary takes no suggestions', async () => {
		mockRefusesSuggestions = true
		await renderWithQuery([wordEntry])

		expect(screen.queryByText('Suggest an Edit')).toBeNull()
	})

	it("offers Suggest an Edit on Carleton's dictionary", async () => {
		useCampusStore.setState({campus: 'edu.carleton'})
		await renderWithQuery([wordEntry], 'edu.carleton')

		expect(screen.getByText('Suggest an Edit')).toBeTruthy()
	})

	it('starts a draft from the entry on screen and pushes to the edit form', async () => {
		await renderWithQuery([wordEntry])

		await fireEvent.press(await screen.findByText('Suggest an Edit'))

		expect(useDictionaryDraftStore.getState().original).toEqual({
			word: 'Caf',
			senses: [{definition: 'The dining hall.'}],
		})
		expect(mockNavigate).toHaveBeenCalledWith('/dictionary/entry/edit')
	})

	it('does nothing if the button fires with no entry to start a draft from', async () => {
		// The toolbar button renders in the loading and not-found branches too,
		// where there is nothing yet to seed a draft with. An empty word list
		// reaches the not-found branch, which exercises the same guard.
		await renderWithQuery([])

		await fireEvent.press(await screen.findByText('Suggest an Edit'))

		expect(useDictionaryDraftStore.getState().original).toBeNull()
		expect(mockNavigate).not.toHaveBeenCalled()
	})
})
