import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {BalancesView} from '../balances'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const mockNavigate = jest.fn()

jest.mock('expo-router', () => ({useRouter: () => ({navigate: mockNavigate})}))

// The banner fetches its own FAQs, which none of these tests are about.
jest.mock('../../../features/faqs/banner', () => ({FaqBannerGroup: () => null}))

// login.ts reaches the persisted query client, and through it native modules
// Jest does not have. Only the error class and the credentials query matter
// here, and no account is stored.
jest.mock('../../../lib/login', () => ({
	NoCredentialsError: class NoCredentialsError extends Error {},
	credentialsOptions: {queryKey: ['credentials'], queryFn: () => Promise.resolve(null)},
}))

// A run with no stored account: the balances request fails the way it does
// before anyone has logged in.
jest.mock('../../../lib/financials', () => ({
	balancesOptions: () => ({
		queryKey: ['balances'],
		queryFn: () => {
			let {NoCredentialsError} =
				jest.requireMock<typeof import('../../../lib/login')>('../../../lib/login')
			return Promise.reject(new NoCredentialsError('no credentials'))
		},
		retry: false,
	}),
}))

let client: QueryClient

afterEach(() => {
	// A client left holding queries keeps its cache timers alive past the run.
	client.clear()
})

function renderBalances() {
	client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	return render(
		<QueryClientProvider client={client}>
			<BalancesView />
		</QueryClientProvider>,
	)
}

describe('BalancesView without an account', () => {
	/// The row draws a chevron, so it must actually go somewhere.
	it('sends you to Settings to log in', async () => {
		await renderBalances()

		fireEvent.press(await screen.findByLabelText('Log in with St. Olaf'))

		expect(mockNavigate).toHaveBeenCalledWith('/SettingsRoot')
	})
})
