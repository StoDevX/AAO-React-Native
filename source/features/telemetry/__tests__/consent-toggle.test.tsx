import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {setTelemetryConsent} from '../../../init/sentry'
import {ShareTelemetryToggle} from '../consent-toggle'
import {useTelemetryStore} from '../store'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('../../../init/sentry', () => ({setTelemetryConsent: jest.fn()}))
jest.mock('expo-sqlite/kv-store', () => ({
	Storage: {getItemSync: () => null, setItemSync: () => undefined, removeItemSync: () => true},
}))
jest.mock('expo-crypto', () => ({randomUUID: () => 'id-1'}))

const LABEL = 'Share anonymous usage and crash data'

beforeEach(() => {
	jest.clearAllMocks()
	useTelemetryStore.setState({enabled: true, deviceId: null})
})

describe('ShareTelemetryToggle', () => {
	it('shows the saved choice', async () => {
		useTelemetryStore.setState({enabled: false})
		await render(<ShareTelemetryToggle />)

		// The stand-in Toggle is a menuitem, and RNTL only filters `checked` on
		// checkbox-like roles, so read the state the component passed through.
		expect(screen.getByRole('menuitem', {name: LABEL}).props.accessibilityState).toMatchObject({
			checked: false,
		})
	})

	it('turns sharing off when flipped off', async () => {
		await render(<ShareTelemetryToggle />)

		await fireEvent.press(screen.getByText(LABEL))

		expect(setTelemetryConsent).toHaveBeenCalledWith(false)
	})

	it('turns sharing on when flipped on', async () => {
		useTelemetryStore.setState({enabled: false})
		await render(<ShareTelemetryToggle />)

		await fireEvent.press(screen.getByText(LABEL))

		expect(setTelemetryConsent).toHaveBeenCalledWith(true)
	})
})
