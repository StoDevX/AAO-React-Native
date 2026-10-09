import * as React from 'react'
import {Text} from 'react-native'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import * as router from 'expo-router'

import {requiresSection} from '../section-gate'
import {useCampusStore} from '../store'

const Athletics = requiresSection(
	'athletics',
	{title: 'Athletics', noun: 'scores and schedules', systemImage: 'sportscourt'},
	() => <Text>Today's games</Text>,
)

afterEach(() => {
	useCampusStore.setState({campus: 'edu.stolaf'})
	jest.restoreAllMocks()
})

describe('a screen that needs a section of its campus', () => {
	test('draws itself for a campus that has the section', async () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		await render(<Athletics />)

		expect(screen.getByText("Today's games")).toBeTruthy()
	})

	test("says what the app doesn't have for a campus without it, rather than drawing", async () => {
		useCampusStore.setState({campus: 'edu.carleton'})
		await render(<Athletics />)

		expect(screen.queryByText("Today's games")).toBeNull()
		expect(screen.getByText('No Athletics')).toBeTruthy()
		expect(
			screen.getByText("CARLS doesn't have scores and schedules for Carleton College yet."),
		).toBeTruthy()
	})

	test('asks of the campus a link names, over the active one', async () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		jest.spyOn(router, 'useLocalSearchParams').mockReturnValue({campus: 'edu.carleton'})
		await render(<Athletics />)

		expect(screen.getByText('No Athletics')).toBeTruthy()
	})

	test('names the section it needs, so a route can be checked for one', () => {
		expect(Athletics.requiredSection).toBe('athletics')
	})
})
