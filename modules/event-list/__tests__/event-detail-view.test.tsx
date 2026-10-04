import React from 'react'
import {Image} from 'react-native'
import moment from 'moment-timezone'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import type {EventType} from '@frogpond/event-type'

import {EventDetail} from '../event-detail-view'
import {loadBeforeTests} from '../../../source/testing/load-before-tests'

loadBeforeTests('Modal')

// The library's own stand-in: zero insets, where the real hook needs a native provider.
jest.mock(
	'react-native-safe-area-context',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports
		require('react-native-safe-area-context/jest/mock').default,
)

jest.mock('../../../source/components/lib/share-image', () => ({
	shareImage: jest.fn(),
}))

const FEATURED = 'https://example.com/featured.jpg'

/** What the image loader reports for a picture's pixel size, or that it cannot. */
function reportImageSize(size: {width: number; height: number} | null): void {
	jest.spyOn(Image, 'getSize').mockImplementation(((
		_uri: string,
		success: (width: number, height: number) => void,
		failure?: (error: Error) => void,
	) => {
		if (size) {
			success(size.width, size.height)
		} else {
			failure?.(new Error('no such image'))
		}
	}) as typeof Image.getSize)
}

afterEach(() => {
	jest.restoreAllMocks()
})

const POWERED_BY = {title: 'Powered by the St. Olaf calendar', href: 'https://example.com'}

function makeEvent(overrides: Partial<EventType> = {}): EventType {
	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime: moment('2026-08-17T09:00:00Z'),
		endTime: moment('2026-08-20T18:00:00Z'),
		isAllDay: false,
		isMultiDay: true,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...overrides,
	}
}

describe('EventDetail', () => {
	// The event's own times, rather than hand-fed lines: this is what proves the
	// masthead is wired to `detailTimeLines`. How a line reads is settled in
	// times.test.ts, and how it is laid out is not something Jest can see.
	test('it dates the masthead from the event', async () => {
		await render(<EventDetail color="#ff0000" event={makeEvent()} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Monday, August 17, 2026', {exact: false})).toBeTruthy()
	})

	test('it omits a section whose field is empty', async () => {
		await render(
			<EventDetail color="#ff0000" event={makeEvent({location: ''})} poweredBy={POWERED_BY} />,
		)

		expect(screen.queryByText('Location')).toBeNull()
		expect(screen.getByText('Description')).toBeTruthy()
	})

	test('it shows a links section when the event has links', async () => {
		let links = ['https://example.com/one', 'https://example.com/two']
		await render(<EventDetail color="#ff0000" event={makeEvent({links})} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Links')).toBeTruthy()
	})

	test('it omits the links section when there are none', async () => {
		await render(
			<EventDetail color="#ff0000" event={makeEvent({links: []})} poweredBy={POWERED_BY} />,
		)

		expect(screen.queryByText('Links')).toBeNull()
	})

	test('it shows the featured image when the event has one', async () => {
		reportImageSize({width: 1600, height: 900})
		await render(
			<EventDetail color="#ff0000" event={makeEvent({image: FEATURED})} poweredBy={POWERED_BY} />,
		)

		let image = await screen.findByTestId('event-featured-image')
		expect(image.props.source).toStrictEqual({uri: FEATURED})
	})

	test('it keeps the whole picture, rather than cropping it to the row', async () => {
		reportImageSize({width: 1600, height: 900})
		await render(
			<EventDetail color="#ff0000" event={makeEvent({image: FEATURED})} poweredBy={POWERED_BY} />,
		)

		let image = await screen.findByTestId('event-featured-image')
		expect(image.props.resizeMode).toBe('contain')
	})

	test('it omits the featured image when the event has none', async () => {
		await render(<EventDetail color="#ff0000" event={makeEvent()} poweredBy={POWERED_BY} />)

		expect(screen.queryByTestId('event-featured-image')).toBeNull()
	})

	// A picture that will not load would otherwise leave an empty row.
	test('it omits the featured image when its size cannot be read', async () => {
		reportImageSize(null)
		await render(
			<EventDetail color="#ff0000" event={makeEvent({image: FEATURED})} poweredBy={POWERED_BY} />,
		)

		expect(screen.queryByTestId('event-featured-image')).toBeNull()
	})

	test('it opens the featured image full screen when tapped', async () => {
		reportImageSize({width: 1600, height: 900})
		await render(
			<EventDetail color="#ff0000" event={makeEvent({image: FEATURED})} poweredBy={POWERED_BY} />,
		)
		expect(screen.queryByRole('button', {name: 'Share'})).toBeNull()

		fireEvent.press(await screen.findByTestId('event-featured-image'))

		expect(await screen.findByRole('button', {name: 'Share'})).toBeTruthy()
	})
})
