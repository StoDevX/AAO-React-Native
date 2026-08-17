import React from 'react'
import {act, fireEvent, render} from '@testing-library/react-native'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {FaqBanner, FaqBannerGroup} from '../banner'
import {useFaqBannerStore} from '../store'
import type {Faq, FaqQueryData} from '../types'
import {FAQ_TARGETS} from '../constants'

const FAQS_QUERY_KEY = ['faqs'] as const

jest.mock('../query', () => ({
	faqsOptions: {
		queryKey: FAQS_QUERY_KEY,
		queryFn: () => Promise.reject(new Error('queryFn should not be called')),
	},
}))

const baseFaq: Faq = {
	id: 'home-support',
	question: 'How do I get support?',
	answer: 'Send us an email.',
	bannerTitle: 'Need help?',
	bannerText: 'Reach out any time.',
	targets: [FAQ_TARGETS.HOME],
	updatedAt: '2024-12-02T00:00:00Z',
	severity: 'notice',
	dismissable: true,
}

const buildResponse = (faqs: Faq[]): FaqQueryData => ({
	faqs,
	legacyText: undefined,
})

// Every query left without observers gets a garbage-collection timeout, and
// React Query's default is five minutes -- long enough to outlive the run and
// leave the Jest worker to be force-killed rather than exiting on its own.
// Testing Library registers its unmounting afterEach when it is imported, and
// Jest runs afterEach hooks in registration order, so by the time this one
// runs the components are gone and every gc timeout has been armed.
const trackedQueryClients: QueryClient[] = []

const trackQueryClient = (queryClient: QueryClient): QueryClient => {
	trackedQueryClients.push(queryClient)
	return queryClient
}

afterEach(() => {
	for (let queryClient of trackedQueryClients) {
		queryClient.clear()
	}
	trackedQueryClients.length = 0
})

// Seeded data has to be fresh, not merely present: a stale entry makes the
// query refetch the moment a component mounts, and the mocked queryFn's
// rejection then lands mid-test and empties the banner out from under the
// assertions.
const buildQueryClient = (faqs: Faq[]): QueryClient => {
	const queryClient = trackQueryClient(
		new QueryClient({
			defaultOptions: {queries: {retry: false, staleTime: Infinity}},
		}),
	)
	queryClient.setQueryData<FaqQueryData>(FAQS_QUERY_KEY, buildResponse(faqs))
	return queryClient
}

/// Seeds the same data, but leaves it stale so that mounting kicks off a
/// refetch -- which the mocked queryFn then fails, driving the query into its
/// error state while the cached faqs are still perfectly good.
const buildStaleQueryClient = (faqs: Faq[]): QueryClient => {
	const queryClient = trackQueryClient(
		new QueryClient({
			defaultOptions: {queries: {retry: false}},
		}),
	)
	queryClient.setQueryData<FaqQueryData>(FAQS_QUERY_KEY, buildResponse(faqs))
	return queryClient
}

/// Runs the queued refetch and its rejection to completion.
const settlePendingRefetch = async (): Promise<void> => {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0))
	})
}

const renderWithFaqs = (faqs: Faq[], props?: {onPressOverride?: () => void}) => {
	const queryClient = buildQueryClient(faqs)

	return render(
		<QueryClientProvider client={queryClient}>
			<FaqBanner target={FAQ_TARGETS.HOME} {...props} />
		</QueryClientProvider>,
	)
}

describe('FaqBanner component', () => {
	beforeEach(() => {
		useFaqBannerStore.getState().resetAll()
	})

	it('dismisses the banner when the close button is pressed', async () => {
		let {getByLabelText, queryByText} = await renderWithFaqs([baseFaq])

		let button = getByLabelText('Dismiss FAQ banner')
		await fireEvent.press(button)

		expect(queryByText(baseFaq.bannerTitle)).toBeNull()
	})

	it('calls onPressOverride when the main pressable is tapped', async () => {
		let onPressOverride = jest.fn()
		let {getByText} = await renderWithFaqs([baseFaq], {onPressOverride})

		// Letting queued async work run first keeps a stray refetch from
		// hiding behind a lucky race -- see buildQueryClient.
		await settlePendingRefetch()

		await fireEvent.press(getByText('Learn more'))

		expect(onPressOverride).toHaveBeenCalledTimes(1)
	})

	it('renders as a non-interactive card with no CTA when no override is given', async () => {
		// Rather than a button that silently does nothing, a banner with no
		// tap target drops its button role and "Learn more" CTA entirely --
		// see the comment in ../banner.tsx.
		let {queryByText, queryByRole} = await renderWithFaqs([baseFaq])

		expect(queryByText('Learn more')).toBeNull()
		expect(queryByRole('button', {name: baseFaq.bannerTitle})).toBeNull()
	})

	it('keeps showing a cached banner when a background refetch fails', async () => {
		let {getByText} = await render(
			<QueryClientProvider client={buildStaleQueryClient([baseFaq])}>
				<FaqBanner target={FAQ_TARGETS.HOME} />
			</QueryClientProvider>,
		)

		await settlePendingRefetch()

		expect(getByText(baseFaq.bannerTitle)).toBeTruthy()
	})
})

describe('FaqBannerGroup component', () => {
	beforeEach(() => {
		useFaqBannerStore.getState().resetAll()
	})

	it("calls onPressFaq with each banner's own id, not a shared/stale one", async () => {
		let secondFaq: Faq = {
			...baseFaq,
			id: 'second-faq',
			bannerTitle: 'Second banner',
		}
		let onPressFaq = jest.fn()

		let queryClient = buildQueryClient([baseFaq, secondFaq])

		let {getByTestId} = await render(
			<QueryClientProvider client={queryClient}>
				<FaqBannerGroup onPressFaq={onPressFaq} target={FAQ_TARGETS.HOME} />
			</QueryClientProvider>,
		)

		await fireEvent.press(getByTestId(`faq-banner-${secondFaq.id}`))

		expect(onPressFaq).toHaveBeenCalledWith(secondFaq.id)
		expect(onPressFaq).not.toHaveBeenCalledWith(baseFaq.id)
	})

	it('keeps showing cached banners when a background refetch fails', async () => {
		let {getByTestId} = await render(
			<QueryClientProvider client={buildStaleQueryClient([baseFaq])}>
				<FaqBannerGroup target={FAQ_TARGETS.HOME} />
			</QueryClientProvider>,
		)

		await settlePendingRefetch()

		expect(getByTestId(`faq-banner-${baseFaq.id}`)).toBeTruthy()
	})
})
jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
