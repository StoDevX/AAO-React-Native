import React from 'react'
import {Linking} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {openUrl} from '@frogpond/open-url'

import {keys} from '../../building-hours/query'
import type {BuildingType} from '../../building-hours/types'
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

/// The Hours each campus's cache holds while a card renders; a test sets it
/// before rendering.
let mockVenues: Record<'stolaf' | 'carleton', BuildingType[]> = {stolaf: [], carleton: []}

// Cleared after each test, or its gc timers keep the Jest worker alive.
const trackedQueryClients: QueryClient[] = []

afterEach(() => {
	jest.restoreAllMocks()
	mockOpenUrl.mockClear()
	for (let queryClient of trackedQueryClients) {
		queryClient.clear()
	}
	trackedQueryClients.length = 0
	mockVenues = {stolaf: [], carleton: []}
})

/// Renders a card over a cache seeded with `mockVenues`. Seeding rather than
/// mocking the query keeps the card on its real data path, and an unending
/// staleTime stops a mount from refetching over the seed.
function renderCard(ui: React.ReactElement) {
	let client = new QueryClient({defaultOptions: {queries: {retry: false, staleTime: Infinity}}})
	trackedQueryClients.push(client)
	client.setQueryData(keys.all('stolaf'), mockVenues.stolaf)
	client.setQueryData(keys.all('carleton'), mockVenues.carleton)
	return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('BuildingInfo', () => {
	// `Linking` rather than `openUrl`: a universal link goes to Maps.app, where
	// the in-app browser would land on Apple's web fallback page instead.
	// `urls.test.ts` covers the URL itself.
	it('opens an address through Linking, not the in-app browser', async () => {
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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
		await renderCard(
			<BuildingInfo
				campus="stolaf"
				building={makeBuilding({id: 'a', name: 'Alpha Hall', address: '1520 St Olaf Ave'})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getByText('Details')).toBeTruthy()
	})

	it('opens a parsed department link from its tile', async () => {
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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
		await renderCard(
			<BuildingInfo campus="stolaf" building={undefined} onClose={jest.fn()} stop="medium" />,
		)

		expect(screen.getByText(/not found/iu)).toBeTruthy()
	})
})

describe('BuildingInfo header', () => {
	it('closes from the header button', async () => {
		let onClose = jest.fn()
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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
			await renderCard(
				<BuildingInfo
					campus="stolaf"
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
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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
		await renderCard(
			<BuildingInfo
				campus="stolaf"
				building={makeBuilding({id: 'a', name: 'Lot Q'})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(sectionOrder()).toEqual([])
	})

	it('names the abbreviation in Good to Know, once when the nickname matches it', async () => {
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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

	// The feed can list one department twice, or two with a name and no link.
	it('keeps each tile apart when two share a name and link', async () => {
		let error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
		await renderCard(
			<BuildingInfo
				campus="stolaf"
				building={makeBuilding({
					id: 'a',
					name: 'Tomson Hall',
					departments: ['Biology <https://example.com/b>', 'Biology <https://example.com/b>'],
				})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getAllByText('Biology')).toHaveLength(2)
		let warnings = error.mock.calls.map((args) => args.map(String).join(' '))
		expect(warnings.filter((warning) => warning.includes('same key'))).toEqual([])
	})

	it('offers More on a section only when it hides two or more', async () => {
		let departments = Array.from({length: 8}, (_, i) => `Dept ${i} <https://example.com/${i}>`)
		let offices = Array.from({length: 7}, (_, i) => `Office ${i} <https://example.com/o${i}>`)
		await renderCard(
			<BuildingInfo
				campus="stolaf"
				building={makeBuilding({id: 'a', name: 'Tomson Hall', departments, offices})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		// Named for its section, so VoiceOver can tell the two apart.
		expect(screen.getByRole('button', {name: 'More departments'})).toBeTruthy()
		expect(screen.queryByRole('button', {name: 'More offices'})).toBeNull()
		// The carousel ends on a tile counting what it left out.
		expect(screen.getByRole('button', {name: 'Show all 8 departments'})).toBeTruthy()
		expect(screen.getByText('2 more')).toBeTruthy()
		// Seven offices show all seven: a More tile would stand in for just one.
		expect(screen.getByText('Office 6')).toBeTruthy()
		expect(screen.queryByRole('button', {name: /Show all \d+ offices/u})).toBeNull()
	})

	// Directions waits on a walking routing engine; see lib/card-actions.ts.
	// The building has a point, so only that switch keeps Directions away.
	it('offers no Directions', async () => {
		let building = makeBuilding({id: 'a', name: 'Alpha Hall'})
		await renderCard(
			<BuildingInfo
				campus="stolaf"
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

	// Trailing blank lines would count as lines of their own, so a short
	// description could be clamped with MORE and nothing behind it.
	it('hands About its text without trailing blank lines', async () => {
		await renderCard(
			<BuildingInfo
				campus="stolaf"
				building={makeBuilding({id: 'a', name: 'Alpha Hall', description: 'A hall.\n\n'})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getByText('A hall.', {normalizer: (text) => text})).toBeTruthy()
	})

	it('shows a photo tile for a building with a photo', async () => {
		await renderCard(
			<BuildingInfo
				campus="stolaf"
				building={makeBuilding({id: 'a', name: 'Alpha Hall', photos: ['alpha.jpg']})}
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.getByLabelText('Photo of Alpha Hall')).toBeTruthy()
	})
})

function venue(
	name: string,
	building: string | undefined,
	kind: BuildingType['kind'],
): BuildingType {
	return {
		name,
		category: 'Academia',
		kind,
		building,
		schedule: [
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '7:00am', to: '10:00pm'}],
			},
		],
	}
}

describe('BuildingInfo hours', () => {
	it("shows a building's own hours between its photo and About", async () => {
		mockVenues.stolaf = [venue('Holland Hall', 'hh', 'building')]
		await renderCard(
			<BuildingInfo
				building={makeBuilding({
					id: 'hh',
					name: 'Holland Hall',
					description: 'A hall.',
					photos: ['hh.jpg'],
				})}
				campus="stolaf"
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		let tree = JSON.stringify(screen.toJSON())
		let photo = tree.indexOf('Photo of Holland Hall')
		let hours = tree.indexOf('"Hours"')
		let about = tree.indexOf('"About"')
		expect(photo).toBeGreaterThan(-1)
		expect(hours).toBeGreaterThan(photo)
		expect(about).toBeGreaterThan(hours)
	})

	it('shows no Hours for a point with several venues', async () => {
		mockVenues.stolaf = [
			venue('The Pause Kitchen', 'thelionspause', 'space'),
			venue("Lion's Pause Pizza Delivery", 'thelionspause', 'space'),
			venue('C-Store', 'thelionspause', 'space'),
		]
		await renderCard(
			<BuildingInfo
				building={makeBuilding({id: 'thelionspause', name: "The Lion's Pause", parent: 'bc'})}
				campus="stolaf"
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.queryByText('Hours')).toBeNull()
	})

	// Carleton's venues carry no building key, so no card there could match
	// one; fetching the whole feed on every tap would be wasted.
	it('never fetches Hours for a Carleton card', async () => {
		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		trackedQueryClients.push(client)
		await render(
			<QueryClientProvider client={client}>
				<BuildingInfo
					building={makeBuilding({id: 'sayles', name: 'Sayles-Hill'})}
					campus="carleton"
					onClose={jest.fn()}
					stop="medium"
				/>
			</QueryClientProvider>,
		)

		// Idle and still pending: it neither ran nor is running.
		let state = client.getQueryState(keys.all('carleton'))
		expect(state?.fetchStatus).toBe('idle')
		expect(state?.status).toBe('pending')
	})

	it('shows no Hours on a Carleton card, whose venues carry no building', async () => {
		mockVenues.carleton = [venue('Sayles-Hill', undefined, 'building')]
		await renderCard(
			<BuildingInfo
				building={makeBuilding({id: 'sayles', name: 'Sayles-Hill'})}
				campus="carleton"
				onClose={jest.fn()}
				stop="medium"
			/>,
		)

		expect(screen.queryByText('Hours')).toBeNull()
	})
})
