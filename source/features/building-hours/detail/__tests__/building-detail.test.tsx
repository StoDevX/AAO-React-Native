import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import type {BuildingType} from '../../types'
import {BuildingDetailSwiftUI} from '../building-detail'

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
// suite isn't the one to first trip over that unrelated gap.
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
	// Regression test: a schedule's `notes` used to be handed straight to
	// Section's `footer` prop, a bare string in a SwiftUI slot that crashes at
	// mount. Every building with notes -- "The Cage" among them -- hit this on
	// every render once the detail screen became reachable.
	test('renders a schedule with notes without throwing', () => {
		let building = makeBuilding()

		expect(() =>
			render(<BuildingDetailSwiftUI building={building} now={NOW} onProblemReport={jest.fn()} />),
		).not.toThrow()
	})

	test('renders a schedule with no notes without throwing', () => {
		let building = makeBuilding({
			schedule: [
				{
					title: 'Hours',
					hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
				},
			],
		})

		expect(() =>
			render(<BuildingDetailSwiftUI building={building} now={NOW} onProblemReport={jest.fn()} />),
		).not.toThrow()
	})
})
