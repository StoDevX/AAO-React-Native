import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {VenueCard} from '../venue-card'
import type {BuildingType} from '../../building-hours/types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@frogpond/double-tap', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../mess/__tests__/double-tap-mock') as typeof import('../../mess/__tests__/double-tap-mock')
})
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
jest.mock('@frogpond/place-card-header', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./place-card-header-mock') as typeof import('./place-card-header-mock')
})

const registrar: BuildingType = {
	name: 'Registrar',
	subtitle: 'Office of the Registrar',
	category: 'Offices',
	kind: 'office',
	building: 'toh',
	links: [{title: 'Registrar website', url: 'https://wp.stolaf.edu/registrar'}],
	schedule: [
		{
			title: 'Hours',
			notes: 'Closed for lunch.',
			hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '4:30pm'}],
		},
	],
}

describe('VenueCard', () => {
	test('names the venue with its kind and place, and shows its hours, formal name and links', async () => {
		let onClose = jest.fn()
		await render(
			<VenueCard
				extraLinks={[{label: 'Registrar', href: 'https://wp.stolaf.edu/registrar/'}]}
				onClose={onClose}
				placeName="Tomson Hall"
				stop="medium"
				venue={registrar}
			/>,
		)

		expect(screen.getByTestId('card-title').props.children).toBe('Registrar')
		expect(screen.getByText('Office · Tomson Hall')).toBeTruthy()
		expect(screen.getByText('Hours')).toBeTruthy()
		expect(screen.getByText('Office of the Registrar')).toBeTruthy()
		expect(screen.getByText('Closed for lunch.')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Open Registrar website'})).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Open Registrar'})).toBeTruthy()
		await fireEvent.press(screen.getByLabelText('Close'))
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	test('names only the kind of a venue with no place', async () => {
		await render(
			<VenueCard
				onClose={jest.fn()}
				placeName={null}
				stop="medium"
				venue={{...registrar, kind: 'space'}}
			/>,
		)

		expect(screen.getByText('Space')).toBeTruthy()
	})

	// The Hours feed can still be loading, or have renamed the venue.
	test('says so when the venue is not in the Hours data', async () => {
		let onClose = jest.fn()
		await render(<VenueCard onClose={onClose} placeName={null} stop="medium" venue={undefined} />)

		expect(screen.getByText('Place not found.')).toBeTruthy()
		await fireEvent.press(screen.getByLabelText('Close'))
		expect(onClose).toHaveBeenCalledTimes(1)
	})
})
