import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sentry from '@sentry/react-native'
import {setFloatingButtonEnabled} from '@frogpond/debug-tools'

import {settle} from '../../../testing/settle'
import {useDeveloperStore} from '../store'
import {startFloatingButtonSync} from '../floating-button'

let mockAvailable = true

jest.mock('@frogpond/debug-tools', () => ({
	get isDebugSwiftAvailable() {
		return mockAvailable
	},
	setFloatingButtonEnabled: jest.fn(() => Promise.resolve()),
}))

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

jest.mock('expo-asset', () => ({
	Asset: {
		fromModule: jest.fn((source: unknown) => ({
			downloadAsync: () => Promise.resolve({localUri: `file:///cache/${String(source)}.png`}),
		})),
	},
}))

jest.mock('../../../../images/icons', () => ({
	appIcons: {'old-main-retro': {light: 'retro-light', dark: 'retro-dark'}},
}))

let mockSet = jest.mocked(setFloatingButtonEnabled)

// Each test starts as a fresh install: nothing stored, nothing pushed.
beforeEach(async () => {
	mockAvailable = true
	useDeveloperStore.setState({floatingButtonEnabled: false})
	await AsyncStorage.clear()
	mockSet.mockClear()
	jest.mocked(Sentry.captureException).mockClear()
})

describe('useDeveloperStore', () => {
	// Read from the initial state, since each test here resets the store.
	test('leaves the floating button off on a fresh install', () => {
		expect(useDeveloperStore.getInitialState().floatingButtonEnabled).toBe(false)
	})

	test('remembers the floating button across launches', async () => {
		useDeveloperStore.getState().setFloatingButtonEnabled(true)
		let saved = await AsyncStorage.getItem('developer-preferences')
		// A relaunch: memory starts over at the default, the device keeps what
		// was saved.
		useDeveloperStore.setState({floatingButtonEnabled: false})
		await AsyncStorage.setItem('developer-preferences', saved as string)
		await useDeveloperStore.persist.rehydrate()
		expect(useDeveloperStore.getState().floatingButtonEnabled).toBe(true)
	})
})

describe('startFloatingButtonSync', () => {
	test('hides the button once hydrated, with nothing stored', async () => {
		let stop = startFloatingButtonSync()
		await useDeveloperStore.persist.rehydrate()
		await settle()
		expect(mockSet).toHaveBeenLastCalledWith(false)
		stop()
	})

	test('shows the button drawn as the Old Main Retro icon when turned on', async () => {
		let stop = startFloatingButtonSync()
		await useDeveloperStore.persist.rehydrate()
		useDeveloperStore.getState().setFloatingButtonEnabled(true)
		await settle()
		expect(mockSet).toHaveBeenLastCalledWith(true, {
			light: 'file:///cache/retro-light.png',
			dark: 'file:///cache/retro-dark.png',
		})
		stop()
	})

	test('hides the button again when turned off', async () => {
		let stop = startFloatingButtonSync()
		await useDeveloperStore.persist.rehydrate()
		useDeveloperStore.getState().setFloatingButtonEnabled(true)
		await settle()
		useDeveloperStore.getState().setFloatingButtonEnabled(false)
		await settle()
		expect(mockSet).toHaveBeenLastCalledWith(false)
		stop()
	})

	test('stops pushing once stopped', async () => {
		let stop = startFloatingButtonSync()
		await useDeveloperStore.persist.rehydrate()
		await settle()
		stop()
		mockSet.mockClear()
		useDeveloperStore.getState().setFloatingButtonEnabled(true)
		await settle()
		expect(mockSet).not.toHaveBeenCalled()
	})

	// A Release build, or a UI test or chaos launch, has no DebugSwift to drive.
	test('does nothing without DebugSwift', async () => {
		mockAvailable = false
		let stop = startFloatingButtonSync()
		await useDeveloperStore.persist.rehydrate()
		useDeveloperStore.getState().setFloatingButtonEnabled(true)
		await settle()
		expect(mockSet).not.toHaveBeenCalled()
		stop()
	})

	// A debugging aid, so a failure is reported, never thrown.
	test('reports a failed push to Sentry', async () => {
		let failure = new Error('no button')
		mockSet.mockRejectedValueOnce(failure)
		let stop = startFloatingButtonSync()
		await useDeveloperStore.persist.rehydrate()
		await settle()
		expect(Sentry.captureException).toHaveBeenCalledWith(failure)
		stop()
	})
})
