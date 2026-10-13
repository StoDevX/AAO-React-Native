import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {CampusPicker} from '../campus-picker'
import {useCampusStore} from '../store'

// Quiet: telemetry is not what this checks.
jest.mock('../../telemetry/track', () => ({track: jest.fn()}))

let mockDevMode = false
jest.mock('../../../lib/use-is-dev-mode', () => ({useIsDevMode: () => mockDevMode}))

const WIKI_MONKEYS = 'The College of the Norway Valley Wiki Monkeys'

describe('the campus picker', () => {
	test('offers every campus by name, and picking one makes it the campus', async () => {
		useCampusStore.setState({campus: null})
		await render(<CampusPicker />)

		expect(screen.getByRole('button', {name: 'St. Olaf College'})).toBeTruthy()
		fireEvent.press(screen.getByRole('button', {name: 'Carleton College'}))

		expect(useCampusStore.getState().campus).toBe('edu.carleton')
	})

	test('hides a dev-only campus unless dev mode is on', async () => {
		useCampusStore.setState({campus: null})
		mockDevMode = false
		let {unmount} = await render(<CampusPicker />)
		expect(screen.queryByRole('button', {name: WIKI_MONKEYS})).toBeNull()
		await unmount()

		mockDevMode = true
		await render(<CampusPicker />)
		expect(screen.getByRole('button', {name: WIKI_MONKEYS})).toBeTruthy()
	})
})
