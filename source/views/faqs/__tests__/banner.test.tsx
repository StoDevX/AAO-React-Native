import React from 'react'
import {fireEvent, render} from '@testing-library/react-native'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {FaqBanner} from '../banner'
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

const renderWithFaqs = (
	faqs: Faq[],
	props?: {onPressOverride?: () => void},
) => {
	const queryClient = new QueryClient({
		defaultOptions: {queries: {retry: false}},
	})
	queryClient.setQueryData<FaqQueryData>(FAQS_QUERY_KEY, buildResponse(faqs))

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

	it('renders the banner title and text', async () => {
		let {getByText} = await renderWithFaqs([baseFaq])

		expect(getByText(baseFaq.bannerTitle)).toBeTruthy()
		expect(getByText(baseFaq.bannerText)).toBeTruthy()
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

		await fireEvent.press(getByText('Learn more'))

		expect(onPressOverride).toHaveBeenCalledTimes(1)
	})

	it('does not throw when the main pressable is tapped without an override', async () => {
		// The FAQ detail screen hasn't been migrated to expo-router yet, so
		// with no override this is a no-op fallback rather than a navigation
		// call -- see the comment in ../banner.tsx.
		let {getByText} = await renderWithFaqs([baseFaq])

		expect(() => fireEvent.press(getByText('Learn more'))).not.toThrow()
	})
})
jest.mock('@react-native-vector-icons/ionicons', () => ({Ionicons: 'Icon'}))
