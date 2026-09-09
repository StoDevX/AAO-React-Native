import React from 'react'
import moment from 'moment-timezone'
import {afterEach, describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import type {BuildingType} from '../../types'
import {BuildingDetailSwiftUI} from '../building-detail'
import {images as buildingImages} from '../../../../../images/spaces'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
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

describe('BuildingDetailSwiftUI', () => {
	// Regression test: Section's `footer` is a SwiftUI slot, and handing it a
	// bare string -- rather than wrapping it in `Text` -- crashes at mount.
	// Every building with notes -- "The Cage" among them -- hit this on every
	// render once the detail screen became reachable.
	test('renders a schedule with notes without throwing', () => {
		let building = makeBuilding()

		expect(() =>
			render(<BuildingDetailSwiftUI building={building} campus="stolaf" now={NOW} />),
		).not.toThrow()
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

		let {queryByText} = await render(
			<BuildingDetailSwiftUI building={building} campus="stolaf" now={NOW} />,
		)

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

		let {getByTestId} = await render(
			<BuildingDetailSwiftUI building={building} campus="stolaf" now={NOW} />,
		)

		expect(getByTestId('building-photo')).toBeTruthy()
	})

	test('renders no photo when the building has none', async () => {
		let building = makeBuilding({image: undefined})

		let {queryByTestId} = await render(
			<BuildingDetailSwiftUI building={building} campus="stolaf" now={NOW} />,
		)

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

		let {queryByTestId} = await render(
			<BuildingDetailSwiftUI building={building} campus="carleton" now={NOW} />,
		)

		expect(queryByTestId('building-photo')).toBeNull()
	})
})
