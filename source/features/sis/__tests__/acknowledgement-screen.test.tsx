import * as React from 'react'
import {describe, expect, jest, test, beforeEach} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {Text} from 'react-native'

import SISBalancesPage from '../../../../app/(home)/SIS/index'
import {acknowledgeAcknowledgement} from '../../../redux/parts/settings'

// The redux barrel configures the real store on import, which wires up
// Sentry, and Sentry reaches for a native module Jest does not have. The
// page reads one flag and dispatches one action, so those are all it gets.
const mockDispatch = jest.fn()
let mockAcknowledged = false

jest.mock('../../../redux', () => ({
	useAppDispatch: () => mockDispatch,
	useAppSelector: () => mockAcknowledged,
}))

jest.mock('../balances', () => ({
	BalancesView: () => {
		// oxlint-disable-next-line typescript/no-require-imports
		let {Text: MockText} = require('react-native') as {Text: typeof Text}
		return <MockText>balances</MockText>
	},
}))

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

describe('SIS balances page', () => {
	beforeEach(() => {
		mockDispatch.mockClear()
		mockAcknowledged = false
	})

	test('asks for agreement to each term before showing balances', async () => {
		await render(<SISBalancesPage />)

		expect(
			screen.getByText('The information in the app may not be completely accurate.'),
		).toBeTruthy()
		expect(
			screen.getByText('Bon Appétit is always the final authority on any discrepancies.'),
		).toBeTruthy()
		expect(screen.getByText('This app is not an official college app.')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'I Agree'})).toBeTruthy()
		expect(screen.queryByText('balances')).toBeNull()
	})

	test('records the agreement when I Agree is pressed', async () => {
		await render(<SISBalancesPage />)

		fireEvent.press(screen.getByRole('button', {name: 'I Agree'}))

		expect(mockDispatch).toHaveBeenCalledWith(acknowledgeAcknowledgement(true))
	})

	test('shows balances, and no acknowledgement, once agreed', async () => {
		mockAcknowledged = true

		await render(<SISBalancesPage />)

		expect(screen.getByText('balances')).toBeTruthy()
		expect(screen.queryByRole('button', {name: 'I Agree'})).toBeNull()
	})
})
