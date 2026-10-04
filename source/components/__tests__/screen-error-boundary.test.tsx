import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {Text} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {useChaosFindings} from '../../chaos/findings'
import {ScreenErrorBoundary} from '../screen-error-boundary'

let mockIsChaos = false
jest.mock('@frogpond/launch-arguments', () => ({
	get isChaos() {
		return mockIsChaos
	},
}))

let broken = true

function Screen(): React.ReactNode {
	if (broken) {
		throw new Error('The menu fell over')
	}
	return <Text>All is well</Text>
}

describe('ScreenErrorBoundary', () => {
	beforeEach(() => {
		broken = true
		mockIsChaos = false
		useChaosFindings.setState({latest: '', file: null})
		// React logs the error it catches; the test expects that, so it is
		// silenced here rather than left to bury the output.
		jest.spyOn(console, 'error').mockImplementation(() => undefined)
	})
	afterEach(() => {
		jest.restoreAllMocks()
	})

	test('shows what went wrong in place of a screen that fails to render', async () => {
		await render(
			<ScreenErrorBoundary canGoBack={() => true} goBack={() => undefined}>
				<Screen />
			</ScreenErrorBoundary>,
		)

		expect(screen.getByText('Something went wrong')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Try Again'})).toBeTruthy()
		expect(screen.queryByText('All is well')).toBeNull()
	})

	test('leaves the broken screen when Go Back is pressed', async () => {
		let goBack = jest.fn()
		await render(
			<ScreenErrorBoundary canGoBack={() => true} goBack={goBack}>
				<Screen />
			</ScreenErrorBoundary>,
		)

		await fireEvent.press(screen.getByRole('button', {name: 'Go Back'}))

		expect(goBack).toHaveBeenCalledTimes(1)
	})

	test('offers no Go Back on a screen with nothing behind it', async () => {
		await render(
			<ScreenErrorBoundary canGoBack={() => false} goBack={() => undefined}>
				<Screen />
			</ScreenErrorBoundary>,
		)

		expect(screen.getByRole('button', {name: 'Try Again'})).toBeTruthy()
		expect(screen.queryByRole('button', {name: 'Go Back'})).toBeNull()
	})

	test('renders the screen again when Try Again is pressed and the fault has passed', async () => {
		await render(
			<ScreenErrorBoundary canGoBack={() => true} goBack={() => undefined}>
				<Screen />
			</ScreenErrorBoundary>,
		)

		broken = false
		await fireEvent.press(screen.getByRole('button', {name: 'Try Again'}))

		expect(screen.getByText('All is well')).toBeTruthy()
		expect(screen.queryByText('Something went wrong')).toBeNull()
	})

	test('reports the error as a fatal finding in a chaos run', async () => {
		mockIsChaos = true

		await render(
			<ScreenErrorBoundary canGoBack={() => true} goBack={() => undefined}>
				<Screen />
			</ScreenErrorBoundary>,
		)

		expect(useChaosFindings.getState().latest).toBe('fatal: The menu fell over')
	})

	test('reports no finding outside a chaos run', async () => {
		await render(
			<ScreenErrorBoundary canGoBack={() => true} goBack={() => undefined}>
				<Screen />
			</ScreenErrorBoundary>,
		)

		expect(useChaosFindings.getState().latest).toBe('')
	})
})
