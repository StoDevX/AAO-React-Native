import React from 'react'
import moment from 'moment-timezone'
import {afterEach, describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import type {BuildingType} from '../../types'
import type {Campus} from '../../query'
import {BuildingDetailSwiftUI} from '../building-detail'
import {keys as mapKeys} from '../../../map/query'
import {makeBuilding as makeFeature} from '../../../map/__tests__/fixtures'
import type {Building, Feature} from '../../../map/types'
import {images as buildingImages} from '../../../../../images/spaces'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@maplibre/maplibre-react-native', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/maplibre-mock') as typeof import('../../../../testing/maplibre-mock')
})
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))

// images/spaces imports every building photo through Metro's @2x/@3x density
// resolution, which Jest's resolver does not implement -- mocked here so this
// suite isn't the one to first trip over that unrelated gap. The mocked Map is
// mutable, so tests that need a resolvable photo populate it directly rather
// than re-mocking the module.
jest.mock('../../../../../images/spaces', () => ({images: new Map()}))

const NOW = moment('2026-09-07T12:00:00')

function makeBuilding(overrides: Partial<BuildingType> = {}): BuildingType {
	return {
		name: 'The Cage',
		category: 'Food',
		schedule: [
			{
				title: 'Hours',
				notes: 'The kitchen stops cooking at 8 p.m.',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '7:30am', to: '8:00pm'}],
			},
		],
		...overrides,
	}
}

// Every query left without observers gets a garbage-collection timeout, and
// React Query's default is five minutes -- long enough to outlive the run and
// leave the Jest worker to be force-killed rather than exiting on its own.
// Testing Library registers its unmounting afterEach when it is imported, and
// Jest runs afterEach hooks in registration order, so by the time this one
// runs the components are gone and every gc timeout has been armed.
const trackedQueryClients: QueryClient[] = []

afterEach(() => {
	for (let queryClient of trackedQueryClients) {
		queryClient.clear()
	}
	trackedQueryClients.length = 0
})

/**
 * Renders the detail screen behind a `QueryClientProvider`, since it reads
 * the map's geojson through `useQuery` now -- seeding `mapFeatures` puts that
 * query straight into a warm cache rather than a real fetch, matching how the
 * sheet behaves once `/Map` has visited the same campus.
 */
function renderDetail(
	building: BuildingType,
	campus: Campus = 'stolaf',
	mapFeatures?: Array<Feature<Building>>,
) {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)
	if (mapFeatures) {
		client.setQueryData(mapKeys.all(campus), mapFeatures)
	}
	return render(
		<QueryClientProvider client={client}>
			<BuildingDetailSwiftUI building={building} campus={campus} now={NOW} />
		</QueryClientProvider>,
	)
}

describe('BuildingDetailSwiftUI', () => {
	// Regression test: Section's `footer` is a SwiftUI slot, and handing it a
	// bare string -- rather than wrapping it in `Text` -- crashes at mount.
	// Every building with notes -- "The Cage" among them -- hit this on every
	// render once the detail screen became reachable.
	test('renders a schedule with notes without throwing', () => {
		let building = makeBuilding()

		expect(() => renderDetail(building)).not.toThrow()
	})

	test('renders a schedule with no notes and skips the footer', async () => {
		let noteText = 'The kitchen stops cooking at 8 p.m.'
		let building = makeBuilding({
			schedule: [
				{
					title: 'Hours',
					hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
				},
			],
		})

		let {queryByText} = await renderDetail(building)

		// A schedule with no `notes` must not render another schedule's note
		// text as its footer. This only catches a footer that renders the wrong
		// string; it can't tell `<Text>{undefined}</Text>` apart from omitting
		// the ternary entirely, since both render nothing here.
		expect(queryByText(noteText)).toBeNull()
	})

	afterEach(() => {
		buildingImages.clear()
	})

	test('renders the building photo when the building has one', async () => {
		buildingImages.set('cage', {uri: 'cage.jpg', width: 100, height: 100, scale: 1})
		let building = makeBuilding({image: 'cage'})

		let {getByTestId} = await renderDetail(building)

		expect(getByTestId('building-photo')).toBeTruthy()
	})

	test('renders no photo when the building has none', async () => {
		let building = makeBuilding({image: undefined})

		let {queryByTestId} = await renderDetail(building)

		expect(queryByTestId('building-photo')).toBeNull()
	})

	// CRITICAL regression: `buildingImages` only ever holds St. Olaf's photos.
	// Carleton's Bookstore and Post Office collide with St. Olaf slugs of the
	// same name, and Carleton's Writing Center collides with St. Olaf's
	// `disco` slug -- so a Carleton building whose `image` happens to match
	// one of those keys must still show no photo.
	test('never resolves a photo for a Carleton building, even when its image key collides with a St. Olaf slug', async () => {
		buildingImages.set('disco', {uri: 'disco.jpg', width: 100, height: 100, scale: 1})
		let building = makeBuilding({name: 'Writing Center', image: 'disco'})

		let {queryByTestId} = await renderDetail(building, 'carleton')

		expect(queryByTestId('building-photo')).toBeNull()
	})

	// The whole point of `building` -- Task 1's join key -- is a cutout that
	// frames the venue's own building, not some other one. Registrar is the
	// fixture the plan calls for: its `building` id (`toh`) differs from its
	// own name, so this only passes if the lookup actually joined on the key
	// rather than coincidentally matching a feature named the same as the venue.
	test('shows the cutout, labelled with the joined building, when the venue carries a building key', async () => {
		let toh = makeFeature({id: 'toh', name: 'Tomson Hall'})
		// `makeFeature` defaults to an empty GeometryCollection -- the cutout
		// renders nothing without a real footprint to frame, so this needs one.
		toh.geometry = {
			type: 'GeometryCollection',
			geometries: [
				{
					type: 'Polygon',
					coordinates: [
						[
							[-93.18, 44.46],
							[-93.17, 44.46],
							[-93.17, 44.47],
							[-93.18, 44.47],
						],
					],
				},
			],
		}
		let building = makeBuilding({name: 'Registrar', building: 'toh'})

		let {getByLabelText} = await renderDetail(building, 'stolaf', [toh])

		expect(getByLabelText('Map showing Tomson Hall')).toBeTruthy()
	})

	// Every Carleton venue, and any St. Olaf one not yet keyed to a building,
	// is this case -- no cutout, no placeholder, no empty frame.
	test('shows no cutout when the venue carries no building key', async () => {
		let building = makeBuilding({name: 'Sayles Café', building: undefined})

		let {queryByLabelText} = await renderDetail(building, 'carleton')

		expect(queryByLabelText(/^Map showing/u)).toBeNull()
	})
})
