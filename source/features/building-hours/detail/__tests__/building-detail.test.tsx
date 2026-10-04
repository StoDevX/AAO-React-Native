import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {act, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import type {BuildingType, Campus} from '../../types'
import {BuildingDetailSwiftUI} from '../building-detail'
import {keys as mapKeys} from '../../../map/query'
import {makeBuilding as makeFeature} from '../../../map/__tests__/fixtures'
import type {Building, Feature} from '../../../map/types'
import {loadBeforeTests} from '../../../../testing/load-before-tests'

loadBeforeTests('Image', 'useColorScheme')

jest.mock('@maplibre/maplibre-react-native', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/maplibre-mock') as typeof import('../../../../testing/maplibre-mock')
})
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))

const NOW = moment('2026-09-07T12:00:00')

function makeBuilding(overrides: Partial<BuildingType> = {}): BuildingType {
	return {
		name: 'The Cage',
		category: 'Food',
		kind: 'building',
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
 * sheet behaves once `/map` has visited the same campus.
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

/**
 * Reports a width for every picture row, as SwiftUI's layout pass would once
 * the sheet has laid out. The stand-in has no layout, so until this runs every
 * row reads as zero wide.
 */
async function layOutPictureRows(width: number) {
	let rows = screen.container.queryAll((node) => typeof node.props.onGeometryChange === 'function')
	await act(() => {
		for (let row of rows) {
			row.props.onGeometryChange({x: 0, y: 0, width, height: 160})
		}
	})
}

/** A footprint the cutout can frame -- Tomson Hall, give or take. */
function makeFramedFeature(): Feature<Building> {
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
	return toh
}

describe('BuildingDetailSwiftUI', () => {
	// `building-photo.test.ts` covers which venues resolve a photograph at all.
	// This is the other half: that the screen draws the one it was given.
	test('renders the building photo when the building has one', async () => {
		let building = makeBuilding({image: 'cage'})

		let {getByTestId} = await renderDetail(building)

		expect(getByTestId('building-photo')).toBeTruthy()
	})

	// The whole point of `building` -- Task 1's join key -- is a cutout that
	// frames the venue's own building, not some other one. Registrar is the
	// fixture the plan calls for: its `building` id (`toh`) differs from its
	// own name, so this only passes if the lookup actually joined on the key
	// rather than coincidentally matching a feature named the same as the venue.
	test('shows the cutout, labelled with the joined building, when the venue carries a building key', async () => {
		let building = makeBuilding({name: 'Registrar', building: 'toh'})

		let {getByLabelText} = await renderDetail(building, 'stolaf', [makeFramedFeature()])
		await layOutPictureRows(355)

		expect(getByLabelText('Map showing Tomson Hall')).toBeTruthy()
	})

	// MapLibre fits the camera to the building once, on the map's first
	// layout. A map mounted before its row has a width fits the building into
	// zero points, lands on zoom 0, and stays there -- a map of the world.
	test('mounts the cutout only once its row has a width', async () => {
		let building = makeBuilding({name: 'Registrar', building: 'toh'})

		let {queryByLabelText} = await renderDetail(building, 'stolaf', [makeFramedFeature()])

		expect(queryByLabelText('Map showing Tomson Hall')).toBeNull()

		await layOutPictureRows(355)

		expect(queryByLabelText('Map showing Tomson Hall')).toBeTruthy()
	})

	// The St. Olaf basemap names buildings itself, so the cutout's own label
	// would draw the name twice unless the basemap's copy is filtered out.
	test('hides the basemap label for the framed building on St. Olaf', async () => {
		let building = makeBuilding({name: 'Registrar', building: 'toh'})

		let {queryByTestId} = await renderDetail(building, 'stolaf', [makeFramedFeature()])
		await layOutPictureRows(355)

		expect(queryByTestId('layer:campus_labels_buildings')).toBeTruthy()
	})

	// Carleton's basemap has no such layer; overriding one it lacks is a
	// native error rather than a no-op.
	test('leaves the Carleton basemap labels alone', async () => {
		let building = makeBuilding({name: 'Registrar', building: 'toh'})

		let {queryByLabelText, queryByTestId} = await renderDetail(building, 'carleton', [
			makeFramedFeature(),
		])
		await layOutPictureRows(355)

		expect(queryByLabelText('Map showing Tomson Hall')).toBeTruthy()
		expect(queryByTestId('layer:campus_labels_buildings')).toBeNull()
	})

	// Every Carleton venue, and any St. Olaf one not yet keyed to a building,
	// is this case -- no cutout, no placeholder, no empty frame.
	test('shows no cutout when the venue carries no building key', async () => {
		let building = makeBuilding({name: 'Sayles Café', building: undefined})

		let {queryByLabelText} = await renderDetail(building, 'carleton')

		expect(queryByLabelText(/^Map showing/u)).toBeNull()
	})

	// A venue whose name is the word people say -- DiSCO, SARN, STORP -- spells
	// itself out here, which is the only place it is spelled out.
	test('spells out a venue formal name', async () => {
		let building = makeBuilding({
			name: 'DiSCO',
			subtitle: 'Digital Scholarship Center at St. Olaf',
		})

		let {queryByText} = await renderDetail(building)

		expect(queryByText('Digital Scholarship Center at St. Olaf')).not.toBeNull()
	})

	test('falls back to the abbreviation when there is no formal name to spell out', async () => {
		let building = makeBuilding({name: 'Academic Success Center', abbreviation: 'ASC'})

		let {queryByText} = await renderDetail(building)

		expect(queryByText('(ASC)')).not.toBeNull()
	})

	// The detail sheet draws its hours with the map card's HoursSection, so a
	// block is headed as written, as the card heads it, not in list capitals.
	test('heads each schedule block as the map card does, under one status', async () => {
		await renderDetail(
			makeBuilding({
				name: 'Stav Hall',
				schedule: [
					{title: 'Breakfast', hours: [{days: ['Mo'], from: '7:15am', to: '9:45am'}]},
					{title: 'Lunch', hours: [{days: ['Mo'], from: '10:30am', to: '2:00pm'}]},
				],
			}),
		)

		expect(screen.getByText('Breakfast')).toBeTruthy()
		expect(screen.getByText('Lunch')).toBeTruthy()
		expect(screen.getAllByText(/^(Open|Closed|Opens|Closes|Reopens)/u)).toHaveLength(1)
	})
})
