import * as React from 'react'
import {AppState, type AppStateStatus} from 'react-native'
import {act, render, screen} from '@testing-library/react-native'
import moment from 'moment-timezone'
import {useNowOverride} from '@frogpond/timer'

import {LockoutGate} from '../lockout-screen'
import {useSecretStore} from '../store'
import {shakeEscape, startShakeWatch, stopShakeWatch} from './something-secret-mock'

jest.mock('@frogpond/something-secret', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./something-secret-mock') as typeof import('./something-secret-mock')
})

const START = moment('2026-10-01T12:00:00-05:00')
const MINUTE = 60_000

function setClock(ms: number) {
	useNowOverride.getState().freeze(moment(ms))
}

beforeEach(() => {
	jest.useFakeTimers()
	setClock(START.valueOf())
	useSecretStore.setState({pressCount: 0, lockedUntil: null})
	jest.mocked(startShakeWatch).mockClear()
	jest.mocked(stopShakeWatch).mockClear()
})

afterEach(() => {
	jest.useRealTimers()
	jest.restoreAllMocks()
	useNowOverride.getState().clear()
})

describe('LockoutGate', () => {
	it('shows nothing while unlocked', async () => {
		await render(<LockoutGate />)
		expect(screen.queryByText('the app is resting.')).toBeNull()
		expect(startShakeWatch).not.toHaveBeenCalled()
	})

	it('shows the dead screen while locked, and watches for a shake', async () => {
		useSecretStore.setState({pressCount: 1, lockedUntil: START.valueOf() + MINUTE})
		await render(<LockoutGate />)
		expect(screen.getByText('the app is resting.')).toBeTruthy()
		expect(startShakeWatch).toHaveBeenCalledTimes(1)
	})

	it('goes away when the lockout runs out', async () => {
		useSecretStore.setState({pressCount: 1, lockedUntil: START.valueOf() + MINUTE})
		await render(<LockoutGate />)
		await act(() => {
			setClock(START.valueOf() + MINUTE)
			jest.advanceTimersByTime(1000)
		})
		expect(screen.queryByText('the app is resting.')).toBeNull()
		expect(stopShakeWatch).toHaveBeenCalled()
	})

	it('goes away at once on returning to the foreground after the lockout ended', async () => {
		let listeners: Array<(status: AppStateStatus) => void> = []
		jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
			listeners.push(listener)
			return {remove: () => undefined}
		})
		useSecretStore.setState({pressCount: 1, lockedUntil: START.valueOf() + MINUTE})
		await render(<LockoutGate />)
		await act(() => {
			setClock(START.valueOf() + 10 * MINUTE)
			for (let listener of listeners) {
				listener('active')
			}
		})
		expect(screen.queryByText('the app is resting.')).toBeNull()
	})

	it('unlocks a lockout the clock has moved back past', async () => {
		useSecretStore.setState({pressCount: 3, lockedUntil: START.valueOf() + 16 * MINUTE})
		await render(<LockoutGate />)
		expect(screen.queryByText('the app is resting.')).toBeNull()
		expect(useSecretStore.getState()).toMatchObject({pressCount: 3, lockedUntil: null})
	})

	it('lets a shake out early, after a word, keeping the press count', async () => {
		useSecretStore.setState({pressCount: 2, lockedUntil: START.valueOf() + 5 * MINUTE})
		await render(<LockoutGate />)
		await act(() => shakeEscape())
		expect(screen.getByText("you've angered it")).toBeTruthy()
		expect(useSecretStore.getState().lockedUntil).not.toBeNull()
		await act(() => {
			jest.advanceTimersByTime(2000)
		})
		expect(screen.queryByText("you've angered it")).toBeNull()
		expect(screen.queryByText('the app is resting.')).toBeNull()
		expect(useSecretStore.getState()).toMatchObject({pressCount: 2, lockedUntil: null})
	})
})
