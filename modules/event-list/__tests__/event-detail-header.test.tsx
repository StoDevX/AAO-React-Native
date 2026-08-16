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
	// The event's name is not here -- it is the screen's native large title, set
	// by the route -- so this component is only the date range and its bar.
	test('it shows a line per date, meridiem included in time', async () => {
		await render(
			<EventDetailHeader
				color="#ff0000"
				lines={[
					{prefix: 'From', time: '9 AM', date: 'Monday, August 17, 2026'},
					{prefix: 'to', time: '6 PM', date: 'Thursday, August 20, 2026'},
				]}
			/>,
		)

		expect(screen.getByTestId('event-detail-times')).toBeTruthy()
		expect(screen.getByText('From 9 AM Monday, August 17, 2026')).toBeTruthy()
		expect(screen.getByText('to 6 PM Thursday, August 20, 2026')).toBeTruthy()
	})

	test('it renders nothing when there are no lines', async () => {
		await render(<EventDetailHeader color="#ff0000" lines={[]} />)

		expect(screen.queryByTestId('event-detail-times')).toBeNull()
	})

	// The masthead bar is the calendar's colour, so a device event's detail
	// screen matches the tint its row had in the merged list.
	test('it tints the bar with the calendar colour', async () => {
		await render(
			<EventDetailHeader
				color="#34c759"
				lines={[{prefix: 'From', time: '9 AM', date: 'Monday, August 17, 2026'}]}
			/>,
		)

		let bar = screen.getByTestId('event-detail-bar')
		expect(bar.props.modifiers).toContainEqual({$type: 'background', value: '#34c759'})
	})
})
