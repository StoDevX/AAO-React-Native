import * as React from 'react'
import {render} from '@testing-library/react-native'
import {Text} from 'react-native'

import {useDismissOnce} from '../use-dismiss-once'

// Named `mock…` so jest's hoisting of the factory above it is allowed.
let mockGoBack = jest.fn()

jest.mock('expo-router', () => ({useNavigation: () => ({goBack: mockGoBack})}))

function Harness({presses}: {presses: number}): React.ReactNode {
	let dismiss = useDismissOnce()
	for (let i = 0; i < presses; i++) {
		dismiss()
	}
	return <Text>done</Text>
}

beforeEach(() => {
	mockGoBack.mockClear()
})

test('leaves the screen when asked', async () => {
	await render(<Harness presses={1} />)
	expect(mockGoBack).toHaveBeenCalledTimes(1)
})

test('ignores every press after the first', async () => {
	await render(<Harness presses={5} />)
	expect(mockGoBack).toHaveBeenCalledTimes(1)
})
