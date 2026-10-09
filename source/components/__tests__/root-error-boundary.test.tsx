import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {Text} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {useCampusStore} from '../../features/campus/store'
import {openEmail} from '../../features/support/open-email'
import {RootErrorBoundary} from '../root-error-boundary'

jest.mock('../../features/support/open-email', () => ({openEmail: jest.fn()}))

let broken = true

function Screen(): React.ReactNode {
	if (broken) {
		throw new Error('The radio fell over')
	}
	return <Text>All is well</Text>
}

describe('RootErrorBoundary', () => {
	beforeEach(() => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		broken = true
		// React logs the error it catches; the test expects that, so it is
		// silenced here rather than left to bury the output.
		jest.spyOn(console, 'error').mockImplementation(() => undefined)
	})
	afterEach(() => {
		jest.restoreAllMocks()
	})

	test('shows what went wrong instead of a blank screen when the app fails to render', async () => {
		await render(
			<RootErrorBoundary>
				<Screen />
			</RootErrorBoundary>,
		)

		expect(screen.getByText('Something went wrong')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Try Again'})).toBeTruthy()
		expect(screen.queryByText('All is well')).toBeNull()
	})

	test('renders the app again when Try Again is pressed and the fault has passed', async () => {
		await render(
			<RootErrorBoundary>
				<Screen />
			</RootErrorBoundary>,
		)

		broken = false
		await fireEvent.press(screen.getByRole('button', {name: 'Try Again'}))

		expect(screen.getByText('All is well')).toBeTruthy()
		expect(screen.queryByText('Something went wrong')).toBeNull()
	})

	test('writes to the team when Send Us an Email is pressed', async () => {
		await render(
			<RootErrorBoundary>
				<Screen />
			</RootErrorBoundary>,
		)

		await fireEvent.press(screen.getByRole('button', {name: 'Send Us an Email'}))

		expect(openEmail).toHaveBeenCalledTimes(1)
	})

	test('shows the app, and no fallback, when nothing fails', async () => {
		broken = false

		await render(
			<RootErrorBoundary>
				<Screen />
			</RootErrorBoundary>,
		)

		expect(screen.getByText('All is well')).toBeTruthy()
	})

	test("names the campus's app in the message", async () => {
		useCampusStore.setState({campus: 'edu.carleton'})
		await render(
			<RootErrorBoundary>
				<Screen />
			</RootErrorBoundary>,
		)

		expect(screen.getByText(/^CARLS hit an error/u)).toBeTruthy()
	})

	test('still shows, without an email to send, before any campus is chosen', async () => {
		useCampusStore.setState({campus: null})
		await render(
			<RootErrorBoundary>
				<Screen />
			</RootErrorBoundary>,
		)

		expect(screen.getByText(/^The app hit an error/u)).toBeTruthy()
		expect(screen.queryByRole('button', {name: 'Send Us an Email'})).toBeNull()
	})
})
