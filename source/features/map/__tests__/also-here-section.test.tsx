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

/// How many timers are pending once `ui` has rendered, on a fresh fake clock.
async function timersAfter(ui: React.ReactElement): Promise<number> {
	jest.useFakeTimers()
	try {
		let {unmount} = await render(ui)
		let count = jest.getTimerCount()
		await unmount()
		return count
	} finally {
		jest.clearAllTimers()
		jest.useRealTimers()
	}
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

	test('draws nothing with no tiles', async () => {
		await renderSection([])

		expect(screen.queryByText('Also at This Location')).toBeNull()
	})

	// Every card mounts this section, and most have nothing in it; each would
	// otherwise keep a clock ticking every minute to update statuses it never
	// shows. The renderer keeps timers of its own, so each count is taken on a
	// fresh fake clock and compared with an empty list's.
	test('keeps no clock with no tiles', async () => {
		let baseline = await timersAfter(<List>{null}</List>)
		expect(
			await timersAfter(
				<List>
					<AlsoHereSection onOpen={jest.fn()} tiles={[]} />
				</List>,
			),
		).toBe(baseline)
	})

	test("keeps a clock for its tiles' statuses", async () => {
		let baseline = await timersAfter(<List>{null}</List>)
		let tiles = [office('OSA', openVenue('OSA'))]
		expect(
			await timersAfter(
				<List>
					<AlsoHereSection onOpen={jest.fn()} tiles={tiles} />
				</List>,
			),
		).toBeGreaterThan(baseline)
	})
})
