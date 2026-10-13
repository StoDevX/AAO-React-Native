import * as React from 'react'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {setDebugSwiftEnabled, setFloatingButtonEnabled} from '@frogpond/debug-tools'

import {settle} from '../../../testing/settle'
import {DebugSwiftSection} from '../debugswift-section'
import {useDeveloperStore} from '../store'

let mockAvailable = true
let mockEnabled = false
let mockRunning = false

jest.mock('@frogpond/debug-tools', () => ({
	get isDebugSwiftAvailable() {
		return mockAvailable
	},
	isDebugSwiftEnabled: jest.fn(() => mockEnabled),
	isDebugSwiftRunning: jest.fn(() => Promise.resolve(mockRunning)),
	setDebugSwiftEnabled: jest.fn((enabled: boolean) => {
		mockEnabled = enabled
		mockRunning = mockRunning || enabled
		return Promise.resolve()
	}),
	openDebugSwift: jest.fn(() => Promise.resolve()),
	setFloatingButtonEnabled: jest.fn(() => Promise.resolve()),
}))

jest.mock('expo-asset', () => ({
	Asset: {
		fromModule: jest.fn(() => ({
			downloadAsync: () => Promise.resolve({localUri: 'file:///cache/icon.png'}),
		})),
	},
}))

/** Render, then let the section's first read of whether DebugSwift runs land. */
async function renderSection(): Promise<void> {
	await render(<DebugSwiftSection />)
	await act(async () => {
		await settle()
	})
}

beforeEach(() => {
	mockAvailable = true
	mockEnabled = false
	mockRunning = false
	useDeveloperStore.setState({floatingButtonEnabled: false})
	jest.mocked(setDebugSwiftEnabled).mockClear()
	jest.mocked(setFloatingButtonEnabled).mockClear()
})

// A Release build with dev mode on reaches the Developer screen too.
test('leaves the section out of a build without DebugSwift', async () => {
	mockAvailable = false
	await renderSection()
	expect(screen.queryByText('Enable DebugSwift')).toBeNull()
})

test('offers only the switch while DebugSwift is off', async () => {
	await renderSection()
	expect(screen.getByText('Enable DebugSwift')).toBeTruthy()
	expect(screen.queryByText('Open DebugSwift')).toBeNull()
	expect(screen.queryByText('Floating Button')).toBeNull()
})

test('offers the tools while DebugSwift is on', async () => {
	mockEnabled = true
	mockRunning = true
	await renderSection()
	expect(screen.getByText('Open DebugSwift')).toBeTruthy()
	expect(screen.getByText('Floating Button')).toBeTruthy()
})

test('turns DebugSwift on from its switch', async () => {
	await renderSection()
	await act(async () => {
		fireEvent.press(screen.getByText('Enable DebugSwift'))
		await settle()
	})
	expect(setDebugSwiftEnabled).toHaveBeenCalledWith(true)
	expect(screen.getByText('Open DebugSwift')).toBeTruthy()
})

// The button's own switch may have been left on from before.
test('brings the floating button back when DebugSwift is turned on', async () => {
	useDeveloperStore.setState({floatingButtonEnabled: true})
	await renderSection()
	await act(async () => {
		fireEvent.press(screen.getByText('Enable DebugSwift'))
		await settle()
	})
	expect(setFloatingButtonEnabled).toHaveBeenLastCalledWith(true, {
		light: 'file:///cache/icon.png',
		dark: 'file:///cache/icon.png',
	})
})

// DebugSwift cannot undo its instrumentation, so off waits for a relaunch.
test('says when DebugSwift stays on until the app restarts', async () => {
	mockEnabled = true
	mockRunning = true
	await renderSection()
	expect(screen.queryByText(/until the app restarts/u)).toBeNull()
	await act(async () => {
		fireEvent.press(screen.getByText('Enable DebugSwift'))
		await settle()
	})
	expect(setDebugSwiftEnabled).toHaveBeenCalledWith(false)
	expect(screen.getByText(/until the app restarts/u)).toBeTruthy()
})
