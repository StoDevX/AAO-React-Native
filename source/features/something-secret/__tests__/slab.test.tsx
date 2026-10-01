import * as React from 'react'
import {AccessibilityInfo} from 'react-native'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import moment from 'moment-timezone'
import {useNowOverride} from '@frogpond/timer'

import {SecretSlab} from '../slab'
import {useSecretStore} from '../store'
import {melt, roar} from './something-secret-mock'

jest.mock('@frogpond/something-secret', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./something-secret-mock') as typeof import('./something-secret-mock')
})

const START = moment('2026-10-01T12:00:00-05:00')

function slab() {
	return screen.getByLabelText('Something secret')
}

function stage(): string {
	return String(slab().props.accessibilityValue.text).split(' ')[0]
}

async function tapTimes(n: number) {
	for (let i = 0; i < n; i++) {
		// oxlint-disable-next-line no-await-in-loop -- taps land one after another, as a person's do
		await fireEvent.press(slab())
	}
}

/** Moves the app's clock and lets the decay tick read it. */
async function idle(seconds: number) {
	await act(() => {
		useNowOverride.getState().freeze(START.clone().add(seconds, 'seconds'))
		jest.advanceTimersByTime(300)
	})
}

beforeEach(() => {
	jest.useFakeTimers()
	useNowOverride.getState().freeze(START.clone())
	useSecretStore.setState({buried: false})
	jest.mocked(roar).mockClear()
	jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined)
})

afterEach(() => {
	jest.useRealTimers()
	jest.restoreAllMocks()
	useNowOverride.getState().clear()
})

describe('SecretSlab', () => {
	it('takes up no space while buried', async () => {
		useSecretStore.setState({buried: true})
		await render(<SecretSlab isFocused={true} />)
		expect(screen.queryByLabelText('Something secret')).toBeNull()
	})

	it('starts blank, with a label and hint for VoiceOver', async () => {
		await render(<SecretSlab isFocused={true} />)
		expect(stage()).toBe('blank')
		expect(slab().props.accessibilityHint).toBe('Double-tap repeatedly')
	})

	it('moves through the stages as it is tapped', async () => {
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(30)
		expect(stage()).toBe('tremor')
		await tapTimes(1)
		expect(stage()).toBe('edge')
		await tapTimes(219)
		expect(stage()).toBe('open')
		expect(screen.getByLabelText('do not push?')).toBeTruthy()
	})

	it('announces each stage it rises into', async () => {
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(81)
		expect(AccessibilityInfo.announceForAccessibility).toHaveBeenNthCalledWith(1, 'Something stirs')
		expect(AccessibilityInfo.announceForAccessibility).toHaveBeenNthCalledWith(
			2,
			'Something rises from the ground',
		)
		expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith(
			expect.stringContaining('This is not a button of honor'),
		)
	})

	it('says nothing as it sinks back a stage', async () => {
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(40)
		jest.mocked(AccessibilityInfo.announceForAccessibility).mockClear()
		await idle(13)
		expect(stage()).toBe('tremor')
		expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled()
	})

	it('sinks five taps a second after ten idle seconds', async () => {
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(40)
		await idle(10)
		expect(stage()).toBe('edge')
		await idle(12)
		// 40 - 10 = 30
		expect(stage()).toBe('tremor')
	})

	it('adds a tap to the sunken value, not to where it stood before', async () => {
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(40)
		await idle(12)
		await tapTimes(1)
		// 30 + 1 = 31: the first edge tap. From a stale 40 it would be 41.
		expect(slab().props.accessibilityValue.text).toBe('edge 0.02')
	})

	it('stays open however long it is left', async () => {
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(250)
		await idle(600)
		expect(stage()).toBe('open')
	})

	it('is buried again when the home screen loses focus', async () => {
		let view = await render(<SecretSlab isFocused={true} />)
		await tapTimes(250)
		await view.rerender(<SecretSlab isFocused={false} />)
		await view.rerender(<SecretSlab isFocused={true} />)
		expect(stage()).toBe('blank')
	})

	it('roars once on opening when every draw misses', async () => {
		jest.spyOn(Math, 'random').mockReturnValue(0.5)
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(250)
		expect(roar).toHaveBeenCalledTimes(1)
	})

	it('roars on the first tap past 30 when the draw hits', async () => {
		jest.spyOn(Math, 'random').mockReturnValue(0)
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(30)
		expect(roar).not.toHaveBeenCalled()
		await tapTimes(1)
		expect(roar).toHaveBeenCalledTimes(1)
	})

	it('ignores taps on an open slab', async () => {
		jest.spyOn(Math, 'random').mockReturnValue(0)
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(250)
		let roars = jest.mocked(roar).mock.calls.length
		// The stand-in keeps the slab's Pressable around once open; the native slab ignores
		// taps then, and so must the component.
		await tapTimes(5)
		expect(roar).toHaveBeenCalledTimes(roars)
	})
})

describe('the red button', () => {
	beforeEach(() => {
		useSecretStore.setState({pressCount: 0, lockedUntil: null})
		jest
			.mocked(melt)
			.mockReset()
			.mockImplementation(() => Promise.resolve())
	})

	it('locks the app before the melt starts, so quitting mid-melt still locks', async () => {
		let lockedWhenMeltStarted: number | null = null
		jest.mocked(melt).mockImplementation(() => {
			lockedWhenMeltStarted = useSecretStore.getState().lockedUntil
			return new Promise(() => undefined)
		})
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(250)
		await fireEvent.press(screen.getByLabelText('do not push?'))
		expect(lockedWhenMeltStarted).toBe(START.valueOf() + 60_000)
		expect(melt).toHaveBeenCalledTimes(1)
	})

	it('counts a double press once', async () => {
		await render(<SecretSlab isFocused={true} />)
		await tapTimes(250)
		let button = screen.getByLabelText('do not push?')
		await fireEvent.press(button)
		await fireEvent.press(button)
		expect(useSecretStore.getState().pressCount).toBe(1)
		expect(melt).toHaveBeenCalledTimes(1)
	})
})
