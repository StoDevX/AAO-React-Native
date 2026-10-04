import * as React from 'react'
import {Text} from 'react-native'
import {act, render, screen} from '@testing-library/react-native'

import {useChaosFindings} from '../findings'
import {ChaosGuardFor} from '../guard'
import {useChaosNetwork} from '../network'

function Throws(): React.ReactNode {
	throw new Error('render failed')
}

beforeEach(() => {
	useChaosFindings.setState({latest: '', file: null})
})

afterEach(() => {
	jest.restoreAllMocks()
})

test('renders children untouched outside a chaos run', async () => {
	await render(
		<ChaosGuardFor isChaos={false}>
			<Text>home</Text>
		</ChaosGuardFor>,
	)
	expect(screen.getByText('home')).toBeTruthy()
	expect(screen.queryByTestId('chaos.findings')).toBeNull()
})

test('shows a quiet beacon in a chaos run', async () => {
	await render(
		<ChaosGuardFor isChaos={true}>
			<Text>home</Text>
		</ChaosGuardFor>,
	)
	expect(screen.getByTestId('chaos.findings').props.accessibilityLabel).toBe('none')
})

test('catches a render error, reports it, and keeps the beacon', async () => {
	// React logs the error it caught; capture that rather than let it through.
	let logged = jest.spyOn(console, 'error').mockImplementation(() => undefined)
	await render(
		<ChaosGuardFor isChaos={true}>
			<Throws />
		</ChaosGuardFor>,
	)
	expect(screen.getByTestId('chaos.fatal-boundary')).toBeTruthy()
	expect(screen.getByText('Render Error')).toBeTruthy()
	expect(screen.getByText('render failed')).toBeTruthy()
	expect(screen.getByTestId('chaos.findings').props.accessibilityLabel).toBe('fatal: render failed')
	expect(logged).toHaveBeenCalledTimes(1)
	expect(logged).toHaveBeenCalledWith(
		'Caught error:',
		expect.objectContaining({message: 'render failed'}),
		expect.objectContaining({componentStack: expect.any(String)}),
	)
})

test('shows the network as online, then offline, in a chaos run', async () => {
	useChaosNetwork.setState({offline: false})
	await render(
		<ChaosGuardFor isChaos={true}>
			<Text>home</Text>
		</ChaosGuardFor>,
	)
	expect(screen.getByTestId('chaos.network').props.accessibilityLabel).toBe('online')
	await act(() => useChaosNetwork.setState({offline: true}))
	expect(screen.getByTestId('chaos.network').props.accessibilityLabel).toBe('offline')
})
