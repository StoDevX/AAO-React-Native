import React from 'react'
import {describe, expect, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

import {EventDetailHeader} from '../event-detail-header'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

describe('EventDetailHeader', () => {
	test('it shows a line per date, meridiem included in time', async () => {
		await render(
			<EventDetailHeader
				color="#ff0000"
				lines={[
					{prefix: 'From', time: '9 AM', date: 'Monday, August 17, 2026'},
					{prefix: 'to', time: '6 PM', date: 'Thursday, August 20, 2026'},
				]}
				title="New Faculty Orientation"
			/>,
		)

		expect(screen.getByText('From 9 AM Monday, August 17, 2026')).toBeTruthy()
		expect(screen.getByText('to 6 PM Thursday, August 20, 2026')).toBeTruthy()
	})

	test('it shows the event’s title above the dates', async () => {
		await render(
			<EventDetailHeader
				color="#ff0000"
				lines={[{prefix: 'From', time: '7:45 AM', date: 'Monday, August 17, 2026'}]}
				title="New Faculty Orientation"
			/>,
		)

		expect(screen.getByText('New Faculty Orientation')).toBeOnTheScreen()
	})

	test('it shows the title even when there are no dates', async () => {
		await render(<EventDetailHeader color="#ff0000" lines={[]} title="Laundry Day" />)

		expect(screen.getByText('Laundry Day')).toBeOnTheScreen()
	})
})
