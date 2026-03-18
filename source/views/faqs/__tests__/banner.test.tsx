import React from 'react'
import {fireEvent, render} from '@testing-library/react-native'

import type {UseQueryResult} from '@tanstack/react-query'

import {FaqBanner} from '../banner'
import {useFaqBannerStore} from '../store'
import type {Faq, FaqQueryData} from '../types'
import {useFaqs} from '../query'
import {FAQ_TARGETS} from '../constants'

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({
		navigate: mockNavigate,
	}),
}))

jest.mock('../query', () => ({
	useFaqs: jest.fn(),
}))

const mockedUseFaqs = useFaqs as jest.MockedFunction<typeof useFaqs>

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

const buildFaqQueryResult = (
	faqs: Faq[],
): UseQueryResult<FaqQueryData, unknown> =>
	({
		data: buildResponse(faqs),
		isLoading: false,
		isError: false,
	}) as unknown as UseQueryResult<FaqQueryData, unknown>

describe('FaqBanner component', () => {
	beforeEach(() => {
		useFaqBannerStore.getState().resetAll()
		mockedUseFaqs.mockReturnValue(buildFaqQueryResult([baseFaq]))
		mockNavigate.mockReset()
	})

	it('renders the banner title and text', () => {
		let {getByText} = render(<FaqBanner target={FAQ_TARGETS.HOME} />)

		expect(getByText(baseFaq.bannerTitle)).toBeTruthy()
		expect(getByText(baseFaq.bannerText)).toBeTruthy()
	})

	it('dismisses the banner when the close button is pressed', () => {
		let {getByLabelText, queryByText} = render(
			<FaqBanner target={FAQ_TARGETS.HOME} />,
		)

		let button = getByLabelText('Dismiss FAQ banner')
		fireEvent.press(button)

		expect(queryByText(baseFaq.bannerTitle)).toBeNull()
	})

	it('navigates to FAQ screen when main pressable is tapped', () => {
		let {getByText} = render(<FaqBanner target={FAQ_TARGETS.HOME} />)

		fireEvent.press(getByText('Learn more'))

		expect(mockNavigate).toHaveBeenCalledWith('Faq', {faqId: baseFaq.id})
	})
})
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon')
