import React from 'react'
import {render} from '@testing-library/react-native'

const screens: Array<{options?: {tabBarLabel?: string}}> = []

jest.mock('@frogpond/ccc-calendar', () => ({
	CccCalendarView: 'CccCalendarView',
	namedCalendarOptions: jest.fn(),
}))
jest.mock('@tanstack/react-query', () => ({
	useQuery: jest.fn(),
}))

jest.mock('@react-navigation/bottom-tabs/unstable', () => {
	let React = require('react')

	return {
		createNativeBottomTabNavigator: () => ({
			Navigator: ({children}: {children: React.ReactNode}) => <>{children}</>,
			Screen: (props: {options?: {tabBarLabel?: string}}) => {
				screens.push(props)
				return null
			},
		}),
	}
})

import {View} from '..'

describe('Calendar view', () => {
	beforeEach(() => {
		screens.length = 0
	})

	it('shows only the St. Olaf and Northfield tabs', () => {
		render(<View />)

		expect(screens.map((screen) => screen.options?.tabBarLabel)).toEqual([
			'St. Olaf',
			'Northfield',
		])
	})
})
