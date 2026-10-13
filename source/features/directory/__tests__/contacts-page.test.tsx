import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'

import ContactsPage from '../../../../app/contacts'
import {useCampusStore} from '../../campus/store'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))

function renderPage() {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	return render(
		<QueryClientProvider client={client}>
			<ContactsPage />
		</QueryClientProvider>,
	)
}

afterEach(() => {
	useCampusStore.setState({campus: 'edu.stolaf'})
	jest.clearAllMocks()
})

describe('the Contacts screen', () => {
	test("opens the college's own directory, on a campus that names one", async () => {
		useCampusStore.setState({campus: 'edu.carleton'})
		await renderPage()

		fireEvent.press(screen.getByRole('button', {name: 'Open the Directory'}))

		expect(openUrl).toHaveBeenCalledWith('https://www.carleton.edu/directory/')
	})

	test('offers no directory on a campus that names none', async () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		await renderPage()

		expect(screen.queryByRole('button', {name: 'Open the Directory'})).toBeNull()
	})
})
