import React from 'react'
import {Text} from 'react-native'
import {afterEach, describe, expect, it, jest} from '@jest/globals'
import {act, render} from '@testing-library/react-native'
import moment from 'moment'
import type {EventType} from '@frogpond/event-type'
import {AddToCalendar} from '../add-to-calendar'
import {addToCalendar, type AddToCalendarResult} from '../lib'

jest.mock('../lib', () => ({addToCalendar: jest.fn()}))
// The component holds "Saving…" for at least 500 ms so it doesn't flash.
// Resolved at once here: the tests are about which state follows, not how long.
jest.mock('delay', () => jest.fn(() => Promise.resolve()))

type RenderArgs = {message: string; disabled: boolean; onPress: () => void}

const event: EventType = {
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

/** Render the component and keep hold of what it last asked to draw. */
async function renderButton(): Promise<() => RenderArgs> {
	let latest: RenderArgs | undefined
	await render(
		<AddToCalendar
			compactMessages={true}
			event={event}
			render={(args) => {
				latest = args
				return <Text>{args.message}</Text>
			}}
		/>,
	)
	return () => {
		if (!latest) throw new Error('AddToCalendar never rendered')
		return latest
	}
}

async function press(current: () => RenderArgs): Promise<void> {
	await act(() => {
		current().onPress()
	})
}

describe('AddToCalendar', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	it('starts enabled with no message, so the bar shows Add to Calendar', async () => {
		let current = await renderButton()

		expect(current()).toMatchObject({message: '', disabled: false})
	})

	it('disables the button while the editor is open', async () => {
		let finish: (result: AddToCalendarResult) => void = () => undefined
		jest.mocked(addToCalendar).mockReturnValue(
			new Promise((resolve) => {
				finish = resolve
			}),
		)
		let current = await renderButton()

		await press(current)

		expect(current()).toMatchObject({message: 'Saving…', disabled: true})
		await act(() => finish('cancelled'))
	})

	it('reads Added to Calendar, disabled, after a save', async () => {
		jest.mocked(addToCalendar).mockResolvedValue('saved')
		let current = await renderButton()

		await press(current)

		expect(current()).toMatchObject({message: 'Added to Calendar', disabled: true})
	})

	it('goes back to Add to Calendar when the user cancels', async () => {
		jest.mocked(addToCalendar).mockResolvedValue('cancelled')
		let current = await renderButton()

		await press(current)

		expect(current()).toMatchObject({message: '', disabled: false})
	})

	it('offers a retry when the editor fails', async () => {
		jest.mocked(addToCalendar).mockResolvedValue('error')
		let current = await renderButton()

		await press(current)

		expect(current()).toMatchObject({message: 'Error. Try again?', disabled: false})
	})
})
