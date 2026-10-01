import * as React from 'react'
import {AppState, type AppStateStatus} from 'react-native'
import {act, render} from '@testing-library/react-native'
import moment from 'moment-timezone'
import {useNowOverride} from '@frogpond/timer'

import {useBurialClock} from '../activity'
import {REST_MS} from '../burial'
import {useSecretStore} from '../store'

const START = moment('2026-10-01T12:00:00-05:00')

function Clock(): React.ReactNode {
	useBurialClock()
	return null
}

let listeners: Array<(status: AppStateStatus) => void> = []

function appBecomes(status: AppStateStatus) {
	for (let listener of listeners) {
		listener(status)
	}
}

beforeEach(() => {
	listeners = []
	jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
		listeners.push(listener)
		return {remove: () => undefined}
	})
	useNowOverride.getState().freeze(START.clone())
	useSecretStore.setState({buried: true, lastActiveAt: START.valueOf() - REST_MS})
})

afterEach(() => {
	jest.restoreAllMocks()
	useNowOverride.getState().clear()
})

describe('useBurialClock', () => {
	it('wakes the store at launch, digging up a slab left twelve hours', async () => {
		await render(<Clock />)
		await act(async () => {
			await useSecretStore.persist.rehydrate()
		})
		expect(useSecretStore.getState()).toMatchObject({buried: false, lastActiveAt: START.valueOf()})
	})

	it('notes the time the app leaves the foreground', async () => {
		useSecretStore.setState({buried: true, lastActiveAt: START.valueOf()})
		await render(<Clock />)
		useNowOverride.getState().freeze(START.clone().add(3, 'hours'))
		await act(() => appBecomes('background'))
		expect(useSecretStore.getState().lastActiveAt).toBe(START.clone().add(3, 'hours').valueOf())
	})

	it('wakes the store when the app comes back', async () => {
		useSecretStore.setState({buried: true, lastActiveAt: START.valueOf()})
		await render(<Clock />)
		await act(() => appBecomes('background'))
		useNowOverride.getState().freeze(START.clone().add(12, 'hours'))
		await act(() => appBecomes('active'))
		expect(useSecretStore.getState().buried).toBe(false)
	})
})
