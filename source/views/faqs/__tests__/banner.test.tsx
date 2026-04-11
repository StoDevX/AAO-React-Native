import React from 'react'
import {vi, expect, describe, it, beforeEach} from 'vitest'
import {fireEvent, render} from '@testing-library/react-native'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {FaqBanner} from '../banner'
import {useFaqBannerStore} from '../store'
import type {Faq, FaqQueryData} from '../types'
import {FAQ_TARGETS} from '../constants'

const FAQS_QUERY_KEY = ['faqs'] as const

const mockNavigate = vi.fn()

vi.mock('@react-navigation/native', () => ({
	useNavigation: () => ({
		navigate: mockNavigate,
	}),
}))

vi.mock('../query', () => ({
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

const renderWithFaqs = (faqs: Faq[]) => {
	const queryClient = new QueryClient({
		defaultOptions: {queries: {retry: false}},
	})
	queryClient.setQueryData<FaqQueryData>(FAQS_QUERY_KEY, buildResponse(faqs))

	return render(
		<QueryClientProvider client={queryClient}>
			<FaqBanner target={FAQ_TARGETS.HOME} />
		</QueryClientProvider>,
	)
}

describe('FaqBanner component', () => {
	beforeEach(() => {
		useFaqBannerStore.getState().resetAll()
		mockNavigate.mockReset()
	})

	it('renders the banner title and text', () => {
		let {getByText} = renderWithFaqs([baseFaq])

		expect(getByText(baseFaq.bannerTitle)).toBeTruthy()
		expect(getByText(baseFaq.bannerText)).toBeTruthy()
	})

	it('dismisses the banner when the close button is pressed', () => {
		let {getByLabelText, queryByText} = renderWithFaqs([baseFaq])

		let button = getByLabelText('Dismiss FAQ banner')
		fireEvent.press(button)

		expect(queryByText(baseFaq.bannerTitle)).toBeNull()
	})

	it('navigates to FAQ screen when main pressable is tapped', () => {
		let {getByText} = renderWithFaqs([baseFaq])

		fireEvent.press(getByText('Learn more'))

		expect(mockNavigate).toHaveBeenCalledWith('Faq', {faqId: baseFaq.id})
	})
})
vi.mock('react-native-vector-icons/Ionicons', () => ({
	default: 'Icon',
}))
