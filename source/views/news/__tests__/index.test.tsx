import React from 'react'
import {render} from '@testing-library/react-native'

const screens: Array<{options?: {tabBarLabel?: string}}> = []

jest.mock('../news-list', () => ({
	NewsList: 'NewsList',
}))
jest.mock('../query', () => ({
	namedNewsOptions: jest.fn(),
}))
jest.mock('../../../../images/news-sources/index', () => ({
	mess: 'mess-image',
	oleville: 'oleville-image',
	stolaf: 'stolaf-image',
}))
jest.mock('@tanstack/react-query', () => ({
	useQuery: jest.fn(),
}))

jest.mock('@react-navigation/bottom-tabs/unstable', () => {
	const ReactActual = jest.requireActual<typeof import('react')>('react')

	return {
		createNativeBottomTabNavigator: () => ({
			Navigator: ({children}: {children: React.ReactNode}) =>
				ReactActual.createElement(ReactActual.Fragment, null, children),
			Screen: (props: {options?: {tabBarLabel?: string}}) => {
				screens.push(props)
				return null
			},
		}),
	}
})

import {View} from '..'

describe('News view', () => {
	beforeEach(() => {
		screens.length = 0
	})

	it('shows only the St. Olaf and The Mess tabs', () => {
		render(<View />)

		expect(screens.map((screen) => screen.options?.tabBarLabel)).toEqual([
			'St. Olaf',
			'The Mess',
		])
	})
})
