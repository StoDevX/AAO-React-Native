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
jest.mock('@frogpond/double-tap', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../mess/__tests__/double-tap-mock') as typeof import('../../mess/__tests__/double-tap-mock')
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

	it('shows the address under Details', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Alpha Hall', address: '1520 St Olaf Ave'})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getByText('Details')).toBeTruthy()
	})

	it('opens a parsed department link from its tile', async () => {
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
		expect(screen.getByTestId('card-big-subtitle')).toHaveTextContent('Administrative & Academic')
	})

	// Carleton's feed carries no type at all.
	it.each([undefined, null, ''])(
		'shows no subtitle under the big title for a type of %p',
		async (type) => {
			await render(
				<BuildingInfo
					building={makeBuilding({id: 'a', name: 'Sayles-Hill Campus Center', type})}
					onClose={jest.fn()}
					stop="large"
				/>,
			)

			expect(screen.getByText('Sayles-Hill Campus Center')).toBeTruthy()
			expect(screen.queryByTestId('card-big-subtitle')).toBeNull()
		},
	)

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

function sectionOrder(): Array<string> {
	let tree = JSON.stringify(screen.toJSON())
	return ['About', 'Good to Know', 'Departments', 'Offices', 'Floors', 'Links', 'Details']
		.map((title) => ({title, at: tree.indexOf(`"${title}"`)}))
		.filter(({at}) => at !== -1)
		.sort((a, b) => a.at - b.at)
		.map(({title}) => title)
}

describe('BuildingInfo sections', () => {
	it('lays out every section in Maps order', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Alpha Hall',
					description: 'A hall.',
					abbreviation: 'AH',
					departments: ['Biology <https://wp.stolaf.edu/biology>'],
					offices: ['Registrar <https://wp.stolaf.edu/registrar>'],
					floors: ['Floor 1 <https://example.com/1.pdf>'],
					links: [{label: 'Website', href: 'https://example.com'}],
					address: '1520 St Olaf Ave',
				})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(sectionOrder()).toEqual([
			'About',
			'Good to Know',
			'Departments',
			'Offices',
			'Floors',
			'Links',
			'Details',
		])
	})

	// The feed is not validated at the boundary, so a record can omit these.
	it('copes with a description and nickname the feed left out', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Lot Q',
					description: undefined as never,
					nickname: undefined as never,
				})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(sectionOrder()).toEqual([])
	})

	it('leaves out every section with nothing to show', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Lot Q'})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(sectionOrder()).toEqual([])
	})

	it('names the abbreviation in Good to Know, once when the nickname matches it', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Regents Hall',
					abbreviation: 'RNS',
					nickname: 'RNS',
				})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getByText('Abbreviated RNS')).toBeTruthy()
		expect(screen.queryByText('RNS')).toBeNull()
	})

	it('offers More on a section only past six of its own', async () => {
		let departments = Array.from({length: 7}, (_, i) => `Dept ${i} <https://example.com/${i}>`)
		let offices = Array.from({length: 6}, (_, i) => `Office ${i} <https://example.com/o${i}>`)
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Tomson Hall', departments, offices})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		// Named for its section, so VoiceOver can tell the two apart.
		expect(screen.getByRole('button', {name: 'More departments'})).toBeTruthy()
		expect(screen.queryByRole('button', {name: 'More offices'})).toBeNull()
		// The carousel ends on a tile counting what it left out.
		expect(screen.getByRole('button', {name: 'Show all 7 departments'})).toBeTruthy()
		expect(screen.getByText('1 more')).toBeTruthy()
		expect(screen.queryByRole('button', {name: /Show all \d+ offices/u})).toBeNull()
	})

	// Directions waits on a walking routing engine; see lib/card-actions.ts.
	// The building has a point, so only that switch keeps Directions away.
	it('offers no Directions', async () => {
		let building = makeBuilding({id: 'a', name: 'Alpha Hall'})
		await render(
			<BuildingInfo
				building={{
					...building,
					geometry: {
						type: 'GeometryCollection',
						geometries: [{type: 'Point', coordinates: [-93.1839, 44.4618]}],
					},
				}}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.queryByRole('button', {name: 'Directions'})).toBeNull()
	})

	it('shows a photo tile for a building with a photo', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({id: 'a', name: 'Alpha Hall', photos: ['alpha.jpg']})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getByLabelText('Photo of Alpha Hall')).toBeTruthy()
	})
})
