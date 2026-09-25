import React from 'react'
import {Linking} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'

import {BuildingInfo} from '../building-info'
import {makeBuilding} from './fixtures'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
jest.mock('@frogpond/place-card-header', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./place-card-header-mock') as typeof import('./place-card-header-mock')
})

const mockOpenUrl = jest.mocked(openUrl)

let mockOpenURL: jest.SpyInstance<Promise<unknown>, [url: string]>

beforeEach(() => {
	mockOpenURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
})

afterEach(() => {
	jest.restoreAllMocks()
	mockOpenUrl.mockClear()
})

describe('BuildingInfo', () => {
	// `Linking` rather than `openUrl`: a universal link goes to Maps.app, where
	// the in-app browser would land on Apple's web fallback page instead.
	// `urls.test.ts` covers the URL itself.
	it('opens an address through Linking, not the in-app browser', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Alpha Hall',
					address: '1520 St Olaf Ave',
				})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		await fireEvent.press(screen.getByText('1520 St Olaf Ave'))

		expect(mockOpenURL).toHaveBeenCalledWith('https://maps.apple.com/?q=1520%20St%20Olaf%20Ave')
	})

	it('opens a parsed department link', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Alpha Hall',
					departments: ['Registrar <https://wp.stolaf.edu/registrar>'],
				})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		await fireEvent.press(screen.getByText('Registrar'))

		expect(mockOpenUrl).toHaveBeenCalledWith('https://wp.stolaf.edu/registrar')
	})

	it('renders St. Olaf-only links', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Alpha Hall',
					links: [{label: 'Directions', href: 'https://wp.stolaf.edu/directions'}],
				})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		await fireEvent.press(screen.getByText('Directions'))

		expect(mockOpenUrl).toHaveBeenCalledWith('https://wp.stolaf.edu/directions')
	})

	it('renders a not-found state when the building is missing', async () => {
		await render(<BuildingInfo building={undefined} onClose={jest.fn()} stop="medium" />)

		expect(screen.getByText(/not found/iu)).toBeTruthy()
	})
})

describe('BuildingInfo header', () => {
	it('titles the card with the name, and the type beneath it', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Regents Hall', type: 'Administrative & Academic'})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getByTestId('card-title')).toHaveTextContent('Regents Hall')
		expect(screen.getByText('Administrative & Academic')).toBeTruthy()
	})

	// Carleton's feed carries no type at all.
	it.each([undefined, null, ''])('shows no subtitle for a type of %p', async (type) => {
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Sayles-Hill Campus Center', type})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getByTestId('card-title')).toHaveTextContent('Sayles-Hill Campus Center')
		expect(screen.queryByText('Administrative & Academic')).toBeNull()
	})

	it.each(['collapsed', 'medium'] as const)('lets the title move at %s', async (stop) => {
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Regents Hall'})}
				onClose={jest.fn()}
				stop={stop}
			/>,
		)

		expect(screen.getByTestId('card-title')).toHaveAccessibilityValue({text: 'animating'})
	})

	it('lists the abbreviation above About', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Regents Hall',
					nickname: 'RNS',
					description: 'Science.',
				})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getByText('RNS')).toBeTruthy()
		// Earlier in the rendered tree means drawn above it in the list.
		let tree = JSON.stringify(screen.toJSON())
		expect(tree.indexOf('Abbreviation')).toBeGreaterThan(-1)
		expect(tree.indexOf('Abbreviation')).toBeLessThan(tree.indexOf('About'))
	})

	it('has no Abbreviation section without a nickname', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Regents Hall'})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.queryByText('Abbreviation')).toBeNull()
	})

	it('closes from the header button', async () => {
		let onClose = jest.fn()
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Regents Hall'})}
				onClose={onClose}
				stop="collapsed"
			/>,
		)

		await fireEvent.press(screen.getByLabelText('Close'))

		expect(onClose).toHaveBeenCalledTimes(1)
	})
})

describe('BuildingInfo at large', () => {
	it('shows the name as the big title, with no header title', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Regents Hall', type: 'Administrative & Academic'})}
				onClose={jest.fn()}
				stop="large"
			/>,
		)

		// Maps' header holds only its buttons while the big title is in view.
		expect(screen.queryByTestId('card-title')).toBeNull()
		expect(screen.getByText('Regents Hall')).toBeTruthy()
		expect(screen.getByText('Administrative & Academic')).toBeTruthy()
	})

	it('keeps the close button in the header', async () => {
		let onClose = jest.fn()
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Regents Hall'})}
				onClose={onClose}
				stop="large"
			/>,
		)

		await fireEvent.press(screen.getByLabelText('Close'))

		expect(onClose).toHaveBeenCalledTimes(1)
	})
})
