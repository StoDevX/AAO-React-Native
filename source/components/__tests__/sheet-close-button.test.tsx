import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {SheetCloseButton} from '../sheet-close-button'

// Named `mock…` so jest's hoisting of the factory above it is allowed.
let mockGoBack = jest.fn()

jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	Stack: require('../../testing/expo-router-mock').Stack,
	useNavigation: () => ({goBack: mockGoBack}),
}))

beforeEach(() => {
	mockGoBack.mockClear()
})

test('closes the sheet only once when pressed twice', async () => {
	await render(<SheetCloseButton />)

	await fireEvent.press(screen.getByLabelText('Close'))
	await fireEvent.press(screen.getByLabelText('Close'))

	expect(mockGoBack).toHaveBeenCalledTimes(1)
})
