import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import * as Sentry from '@sentry/react-native'

import {useChaosFindings} from '../../chaos/findings'
import {openEmail} from '../../features/support/open-email'
import {ScreenErrorFallback} from '../screen-error-boundary'

// Named `mock…` so jest's hoisting of the factories above them is allowed.
let mockIsChaos = false
let mockCanGoBack = true
let mockPathname = '/menus'
let mockGoBack = jest.fn()
let mockNavigate = jest.fn()

jest.mock('@frogpond/launch-arguments', () => ({
	get isChaos() {
		return mockIsChaos
	},
}))

jest.mock('expo-router', () => ({
	useNavigation: () => ({canGoBack: () => mockCanGoBack, goBack: mockGoBack}),
	usePathname: () => mockPathname,
	useRouter: () => ({navigate: mockNavigate}),
}))

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

jest.mock('../../features/support/open-email', () => ({openEmail: jest.fn()}))

const ERROR = new Error('The menu fell over')

function renderFallback(retry: () => Promise<void> = () => Promise.resolve()) {
	return render(<ScreenErrorFallback error={ERROR} retry={retry} />)
}

describe('ScreenErrorFallback', () => {
	beforeEach(() => {
		mockIsChaos = false
		mockCanGoBack = true
		mockPathname = '/menus'
		mockGoBack.mockClear()
		mockNavigate.mockClear()
		jest.mocked(openEmail).mockClear()
		jest.mocked(Sentry.captureException).mockClear()
		useChaosFindings.setState({latest: '', file: null})
	})
	afterEach(() => {
		jest.restoreAllMocks()
	})

	test('says what went wrong and offers Try Again', async () => {
		await renderFallback()

		expect(screen.getByText('Something went wrong')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Try Again'})).toBeTruthy()
	})

	test('renders the screen again when Try Again is pressed', async () => {
		let retry = jest.fn(() => Promise.resolve())
		await renderFallback(retry)

		await fireEvent.press(screen.getByRole('button', {name: 'Try Again'}))

		expect(retry).toHaveBeenCalledTimes(1)
	})

	test('reports the error to Sentry', async () => {
		await renderFallback()

		expect(Sentry.captureException).toHaveBeenCalledWith(ERROR, expect.anything())
	})

	test('leaves the broken screen when Go Back is pressed', async () => {
		await renderFallback()

		await fireEvent.press(screen.getByRole('button', {name: 'Go Back'}))

		expect(mockGoBack).toHaveBeenCalledTimes(1)
	})

	test('offers no Go Back on a screen with nothing behind it', async () => {
		mockCanGoBack = false
		await renderFallback()

		expect(screen.queryByRole('button', {name: 'Go Back'})).toBeNull()
	})

	test('opens the problem report when Report a Problem is pressed', async () => {
		await renderFallback()

		await fireEvent.press(screen.getByRole('button', {name: 'Report a Problem'}))

		expect(mockNavigate).toHaveBeenCalledWith('/report-problem')
	})

	test('offers no Report a Problem when the report is what broke', async () => {
		mockPathname = '/report-problem'
		await renderFallback()

		expect(screen.queryByRole('button', {name: 'Report a Problem'})).toBeNull()
	})

	test('writes to the team when Send Us an Email is pressed', async () => {
		await renderFallback()

		await fireEvent.press(screen.getByRole('button', {name: 'Send Us an Email'}))

		expect(openEmail).toHaveBeenCalledTimes(1)
	})

	test('reports the error as a fatal finding in a chaos run', async () => {
		mockIsChaos = true
		await renderFallback()

		expect(useChaosFindings.getState().latest).toBe('fatal: The menu fell over')
		// What the chaos oracle reads as an error screen, for when a sheet hides the beacon.
		expect(screen.getByTestId('chaos.fatal-boundary')).toBeTruthy()
	})

	test('reports no finding outside a chaos run', async () => {
		await renderFallback()

		expect(useChaosFindings.getState().latest).toBe('')
		expect(screen.queryByTestId('chaos.fatal-boundary')).toBeNull()
	})
})
