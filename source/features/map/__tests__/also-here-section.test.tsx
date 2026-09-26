import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {List} from '@expo/ui/swift-ui'

import {AlsoHereSection} from '../card/also-here-section'
import type {PlaceTile} from '../lib/place-tiles'
import type {BuildingType} from '../../building-hours/types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const EVERY_DAY = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

/// A venue open all day every day, so its status is an open one whenever the
/// test runs.
function openVenue(name: string): BuildingType {
	return {
		name,
		category: 'Offices',
		kind: 'office',
		building: 'bc',
		schedule: [{title: 'Hours', hours: [{days: [...EVERY_DAY], from: '12:00am', to: '11:59pm'}]}],
	}
}

function place(label: string): PlaceTile {
	return {kind: 'place', label, href: null, opens: {kind: 'feature', id: label}}
}

function office(label: string, venue?: BuildingType): PlaceTile {
	return {kind: 'office', label, href: null, opens: {kind: 'venue', name: label}, venue}
}

function renderSection(tiles: Array<PlaceTile>, onOpen = jest.fn()) {
	return render(
		<List>
			<AlsoHereSection onOpen={onOpen} tiles={tiles} />
		</List>,
	)
}

describe('AlsoHereSection', () => {
	test('opens a tile with a status', async () => {
		let onOpen = jest.fn()
		await renderSection([office('OSA', openVenue('OSA'))], onOpen)

		expect(screen.getByText('Also at This Location')).toBeTruthy()
		await fireEvent.press(screen.getByRole('button', {name: /^OSA, Open/u}))
		expect(onOpen).toHaveBeenCalledWith({kind: 'venue', name: 'OSA'})
	})

	test('shows only the name of a place with no hours', async () => {
		await renderSection([place('Stav Hall')])

		expect(screen.getByRole('button', {name: 'Stav Hall'})).toBeTruthy()
		expect(screen.queryByText(/^(Open|Closed|Opens|Closes)/u)).toBeNull()
	})

	test('groups the More grid into Places and Offices', async () => {
		let tiles = [
			...['A', 'B', 'C', 'D', 'E'].map((name) => place(`Place ${name}`)),
			...['A', 'B', 'C'].map((name) => office(`Office ${name}`)),
		]
		await renderSection(tiles)

		await fireEvent.press(screen.getByRole('button', {name: 'More also at this location'}))
		expect(screen.getByText('Places')).toBeTruthy()
		expect(screen.getByText('Offices')).toBeTruthy()
	})

	test('leaves off a group with nothing in it', async () => {
		await renderSection(
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((name) => place(`Place ${name}`)),
		)

		await fireEvent.press(screen.getByRole('button', {name: 'More also at this location'}))
		expect(screen.queryByText('Offices')).toBeNull()
	})

	test('draws nothing with no tiles', async () => {
		await renderSection([])

		expect(screen.queryByText('Also at This Location')).toBeNull()
	})
})
