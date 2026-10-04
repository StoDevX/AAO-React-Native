import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen, within} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import aboutPage from './fixtures/about-page.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {navigationTitleLines} from '../../../testing/navigation-title'
import {waitForQueriesToSettle} from '../../../testing/query-notifications'
import {sendEmail} from '../../../components/send-email'
import {AboutScreen} from '../about-screen'
import {parseAboutPage} from '../lib/about'
import {messKeys} from '../lib/keys'

jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))
jest.mock('../../../components/send-email', () => ({sendEmail: jest.fn()}))
jest.mock(
	'expo-router',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports
		require('../../../testing/expo-router-mock') as object,
)

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
})

afterEach(() => {
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderScreen() {
	return render(
		<QueryClientProvider client={queryClient}>
			<AboutScreen />
		</QueryClientProvider>,
	)
}

describe('AboutScreen', () => {
	test('is titled Contact alone', async () => {
		queryClient.setQueryData(messKeys.about, parseAboutPage(aboutPage))
		await renderScreen()

		expect(navigationTitleLines()).toStrictEqual(['Contact'])
	})

	test("lists the About page's headings, the people under each, and its policy", async () => {
		queryClient.setQueryData(messKeys.about, parseAboutPage(aboutPage))
		await renderScreen()

		expect(screen.getByText('By section')).toBeTruthy()
		expect(screen.getByRole('link', {name: /News Editors/u})).toBeTruthy()
		expect(screen.getByText('Submission Policy')).toBeTruthy()
		expect(screen.getByText(/^The Olaf Messenger encourages contributions/u)).toBeTruthy()
	})

	// Writing leaves the app for Mail, so each row points out of it.
	test('writes to the address a row names, from a row that points out of the app', async () => {
		queryClient.setQueryData(messKeys.about, parseAboutPage(aboutPage))
		await renderScreen()

		let row = screen.getByRole('link', {name: /Sports Editor/u})
		expect(within(row).getByTestId('symbol-arrow.up.right')).toBeTruthy()
		await fireEvent.press(row)

		expect(sendEmail).toHaveBeenCalledWith({to: ['mess-sports@stolaf.edu']})
	})

	test('says the page failed to load, and offers to try again', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockResolvedValue([])
		await renderScreen()
		await waitForQueriesToSettle(queryClient)

		expect(screen.getByText(/The Olaf Messenger has no About page/u)).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Try Again'})).toBeTruthy()
	})
})
