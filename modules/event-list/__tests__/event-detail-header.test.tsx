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
	test('it shows the title and the date range', async () => {
		await render(
			<EventDetailHeader
				times="Aug. 17 9:00 AM to Aug. 20 6:00 PM"
				title="New Faculty Orientation"
			/>,
		)

		expect(screen.getByText('New Faculty Orientation')).toBeTruthy()
		expect(screen.getByText('Aug. 17 9:00 AM to Aug. 20 6:00 PM')).toBeTruthy()
	})

	test('it omits the date range when there is none', async () => {
		await render(<EventDetailHeader times="" title="All-Day Thing" />)

		expect(screen.getByText('All-Day Thing')).toBeTruthy()
		expect(screen.queryByTestId('event-detail-times')).toBeNull()
	})
})
