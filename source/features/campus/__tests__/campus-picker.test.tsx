import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {CampusPicker} from '../../../../app/choose-campus'
import {useCampusStore} from '../store'
import {track} from '../../telemetry/track'

jest.mock('../../telemetry/track', () => ({track: jest.fn()}))

describe('the campus picker', () => {
	test('offers every campus by name, and picking one makes it the campus', async () => {
		useCampusStore.setState({campus: null})
		await render(<CampusPicker />)

		expect(screen.getByRole('button', {name: 'St. Olaf College'})).toBeTruthy()
		fireEvent.press(screen.getByRole('button', {name: 'Carleton College'}))

		expect(useCampusStore.getState().campus).toBe('edu.carleton')
		expect(track).toHaveBeenCalledWith({
			name: 'campus.picked',
			attributes: {campus: 'edu.carleton'},
		})
	})
})
