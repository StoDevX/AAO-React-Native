import * as React from 'react'
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'
import {Text} from 'react-native'
import {act, render} from '@testing-library/react-native'
import delay from 'delay'
import moment from 'moment'
import type {EventType} from '@frogpond/event-type'
import {AddToCalendar} from '../add-to-calendar'
import {addToCalendar} from '../lib'

jest.mock('../lib', () => ({addToCalendar: jest.fn()}))

let saveEvent = jest.mocked(addToCalendar)

function generateEvent(): EventType {
	return {
		title: 'Founders Day',
		description: 'A celebration',
		location: 'Buntrock',
		startTime: moment('2026-09-01T17:00:00Z'),
		endTime: moment('2026-09-01T19:00:00Z'),
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: false, endTime: false, subtitle: 'description'},
	}
}

/**
 * Renders the button and hands back its press handler alongside the rendered
 * label, so a test can drive the save the way a tap would and read back what
 * the button says. The render prop is the component's whole output, so the
 * message is the only thing worth drawing.
 */
async function renderButton(): Promise<{press: () => void; label: () => string}> {
	let press = (): void => {
		throw new Error('the render prop never ran, so there is no button to press')
	}

	let view = await render(
		<AddToCalendar
			compactMessages={true}
			event={generateEvent()}
			render={({message, onPress}) => {
				press = onPress
				return <Text testID="cta">{message || 'Add to Calendar'}</Text>
			}}
		/>,
	)

	return {
		press: () => press(),
		label: () => view.getByTestId('cta').props.children as string,
	}
}

/**
 * Runs the clock forward and lets whatever that released settle. The awaited
 * microtask is what carries a resolved `delay` through to the `setState` after
 * it, so the message a test reads back is the one the timer produced.
 */
const advanceBy = async (ms: number): Promise<void> => {
	await act(async () => {
		jest.advanceTimersByTime(ms)
		await Promise.resolve()
	})
}

describe('AddToCalendar', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
		jest.clearAllMocks()
	})

	it('holds the saving message long enough to be read', async () => {
		saveEvent.mockResolvedValue('saved')

		let {press, label} = await renderButton()
		await act(async () => {
			press()
			await Promise.resolve()
		})

		expect(label()).toBe('Saving…')

		await advanceBy(500)

		expect(label()).toBe('Saved')
	})

	it('lets a slow save satisfy that wait rather than following it', async () => {
		// The floor is on how long the message shows, not on how long the save
		// takes -- a save that already outlasts it needs nothing added.
		saveEvent.mockImplementation(async () => {
			await delay(800)
			return 'saved'
		})

		let {press, label} = await renderButton()
		await act(async () => {
			press()
			await Promise.resolve()
		})

		await advanceBy(800)

		expect(label()).toBe('Saved')
	})

	it('clears the message when the save is cancelled', async () => {
		saveEvent.mockResolvedValue('cancelled')

		let {press, label} = await renderButton()
		await act(async () => {
			press()
			await Promise.resolve()
		})
		await advanceBy(500)

		expect(label()).toBe('Add to Calendar')
	})
})
