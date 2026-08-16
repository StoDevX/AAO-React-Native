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
	test('it shows a line per date, meridiem included', async () => {
		await render(
			<EventDetailHeader
				lines={[
					{prefix: 'From', time: '9', meridiem: 'AM', date: 'Monday, August 17, 2026'},
					{prefix: 'to', time: '6', meridiem: 'PM', date: 'Thursday, August 20, 2026'},
				]}
			/>,
		)

		expect(screen.getByTestId('event-detail-times')).toBeTruthy()
		expect(screen.getByText('From 9 AM Monday, August 17, 2026')).toBeTruthy()
		expect(screen.getByText('to 6 PM Thursday, August 20, 2026')).toBeTruthy()
	})

	test('it renders nothing when there are no lines', async () => {
		await render(<EventDetailHeader lines={[]} />)

		expect(screen.queryByTestId('event-detail-times')).toBeNull()
	})
})
