import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
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

jest.mock('expo-router', () => ({useRouter: () => ({navigate: jest.fn()})}))

// The banner fetches its own FAQs, which none of these tests are about.
jest.mock('../../../features/faqs/banner', () => ({FaqBannerGroup: () => null}))

// login.ts reaches the persisted query client, and through it native modules
// Jest does not have. Only the error class and the credentials query matter
// here.
jest.mock('../../../lib/login', () => ({
	LoginFailedError: class LoginFailedError extends Error {},
	credentialsOptions: {
		queryKey: ['credentials'],
		queryFn: () => Promise.resolve({username: 'ole', password: 'lion'}),
	},
}))

const MOCK_LOGIN_FAILURE = 'Login failed: true'

// A stored account whose login St. Olaf refuses.
jest.mock('../../../lib/financials', () => ({
	balancesOptions: () => ({
		queryKey: ['balances'],
		queryFn: () => {
			let {LoginFailedError} =
				jest.requireMock<typeof import('../../../lib/login')>('../../../lib/login')
			return Promise.reject(new LoginFailedError(MOCK_LOGIN_FAILURE))
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

describe('BalancesView when the login fails', () => {
	it('says why there are no figures', async () => {
		await renderBalances()

		expect(await screen.findByText(MOCK_LOGIN_FAILURE)).toBeOnTheScreen()
	})
})
