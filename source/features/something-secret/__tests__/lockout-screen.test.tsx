import * as React from 'react'
import {AppState, type AppStateStatus} from 'react-native'
import {act, render, screen} from '@testing-library/react-native'
import moment from 'moment-timezone'
import {useNowOverride} from '@frogpond/timer'

import {LockoutGate} from '../lockout-screen'
import {useSecretStore} from '../store'
import {
	coverForRewind,
	rewind,
	shakeEscape,
	startShakeWatch,
	stopShakeWatch,
} from './something-secret-mock'

jest.mock('@frogpond/something-secret', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./something-secret-mock') as typeof import('./something-secret-mock')
})

const START = moment('2026-10-01T12:00:00-05:00')
const MINUTE = 60_000

function setClock(ms: number) {
	useNowOverride.getState().freeze(moment(ms))
}

/** What happened, in order: the native calls, and the store as each one began. */
let events: string[] = []

beforeEach(() => {
	jest.useFakeTimers()
	setClock(START.valueOf())
	useSecretStore.setState({pressCount: 0, lockedUntil: null, buried: false, lastActiveAt: null})
	events = []
	jest
		.mocked(coverForRewind)
		.mockReset()
		.mockImplementation(() => {
			let {lockedUntil} = useSecretStore.getState()
			events.push(`cover (locked: ${lockedUntil !== null})`)
			return Promise.resolve()
		})
	jest
		.mocked(rewind)
		.mockReset()
		.mockImplementation(() => {
			let {lockedUntil, buried} = useSecretStore.getState()
			events.push(`rewind (locked: ${lockedUntil !== null}, buried: ${buried})`)
			return Promise.resolve()
		})
	jest.mocked(startShakeWatch).mockClear()
	jest.mocked(stopShakeWatch).mockClear()
})

afterEach(() => {
	jest.useRealTimers()
	jest.restoreAllMocks()
	useNowOverride.getState().clear()
})

/** Lets the timer tick past the lockout's end and the ending's promises settle. */
async function runOutTheClock(to: number) {
	await act(async () => {
		setClock(to)
		jest.advanceTimersByTime(1000)
		await Promise.resolve()
	})
}

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

	it('ends a run-out lockout behind a cover: unlocks and buries, then rewinds', async () => {
		useSecretStore.setState({pressCount: 1, lockedUntil: START.valueOf() + MINUTE})
		await render(<LockoutGate />)
		await runOutTheClock(START.valueOf() + MINUTE)
		expect(events).toEqual(['cover (locked: true)', 'rewind (locked: false, buried: true)'])
		expect(screen.queryByText('the app is resting.')).toBeNull()
		expect(stopShakeWatch).toHaveBeenCalled()
		expect(useSecretStore.getState()).toMatchObject({pressCount: 1, buried: true})
	})

	it('ends it once when a shake and the timer both finish it', async () => {
		let raise: () => void = () => undefined
		jest
			.mocked(coverForRewind)
			.mockImplementation(() => new Promise((resolve) => (raise = resolve)))
		useSecretStore.setState({pressCount: 1, lockedUntil: START.valueOf() + MINUTE})
		await render(<LockoutGate />)
		// A shake a second before the end; its word is still showing as the timer runs out.
		setClock(START.valueOf() + MINUTE - 1000)
		await act(() => shakeEscape())
		await runOutTheClock(START.valueOf() + MINUTE)
		await act(async () => {
			jest.advanceTimersByTime(2000)
			await Promise.resolve()
		})
		await act(() => raise())
		expect(coverForRewind).toHaveBeenCalledTimes(1)
		expect(rewind).toHaveBeenCalledTimes(1)
	})

	it('ends a lockout that ran out while the app was away, on its return', async () => {
		let listeners: Array<(status: AppStateStatus) => void> = []
		jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
			listeners.push(listener)
			return {remove: () => undefined}
		})
		useSecretStore.setState({pressCount: 1, lockedUntil: START.valueOf() + MINUTE})
		await render(<LockoutGate />)
		await act(async () => {
			setClock(START.valueOf() + 10 * MINUTE)
			for (let listener of listeners) {
				listener('active')
			}
			await Promise.resolve()
		})
		expect(events).toEqual(['cover (locked: true)', 'rewind (locked: false, buried: true)'])
		expect(screen.queryByText('the app is resting.')).toBeNull()
	})

	it('unlocks and buries a lockout the clock has moved back past, with no rewind', async () => {
		useSecretStore.setState({pressCount: 3, lockedUntil: START.valueOf() + 16 * MINUTE})
		await render(<LockoutGate />)
		expect(screen.queryByText('the app is resting.')).toBeNull()
		expect(useSecretStore.getState()).toMatchObject({
			pressCount: 3,
			lockedUntil: null,
			buried: true,
		})
		expect(events).toEqual([])
	})

	it('lets a shake out early, after a word, through the same rewind', async () => {
		useSecretStore.setState({pressCount: 2, lockedUntil: START.valueOf() + 5 * MINUTE})
		await render(<LockoutGate />)
		await act(() => shakeEscape())
		expect(screen.getByText("you've angered it")).toBeTruthy()
		expect(events).toEqual([])
		await act(async () => {
			jest.advanceTimersByTime(2000)
			await Promise.resolve()
		})
		expect(events).toEqual(['cover (locked: true)', 'rewind (locked: false, buried: true)'])
		expect(screen.queryByText("you've angered it")).toBeNull()
		expect(useSecretStore.getState()).toMatchObject({
			pressCount: 2,
			lockedUntil: null,
			buried: true,
		})
	})

	it('seeds a run-out lockout for a UI test that asks for one', async () => {
		// The module itself, not an import's copy of it: the gate reads the flag from this object.
		let launchArguments = jest.requireMock<{secretLockoutEnded: boolean}>(
			'@frogpond/launch-arguments',
		)
		launchArguments.secretLockoutEnded = true
		await render(<LockoutGate />)
		launchArguments.secretLockoutEnded = false
		expect(useSecretStore.persist.hasHydrated()).toBe(true)
		await act(async () => {
			jest.advanceTimersByTime(1000)
			await Promise.resolve()
		})
		expect(events).toEqual(['cover (locked: true)', 'rewind (locked: false, buried: true)'])
		expect(useSecretStore.getState()).toMatchObject({pressCount: 1, buried: true})
	})
})
