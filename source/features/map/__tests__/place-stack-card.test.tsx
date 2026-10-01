import React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {PlaceStackCard} from '../place-stack-card'
import type {StackEntry} from '../lib/place-stack'
import {keys as mapKeys} from '../query'
import {directoryKeys} from '../card-queries'
import {keys as hoursKeys} from '../../building-hours/query'
import type {BuildingType} from '../../building-hours/types'
import {makeBuilding} from './fixtures'

jest.mock('@frogpond/double-tap', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../mess/__tests__/double-tap-mock') as typeof import('../../mess/__tests__/double-tap-mock')
})
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
jest.mock('@frogpond/place-card-header', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./place-card-header-mock') as typeof import('./place-card-header-mock')
})

function venue(name: string, kind: BuildingType['kind'], building: string): BuildingType {
	return {name, category: 'Food', kind, building, schedule: []}
}

const features = [
	makeBuilding({id: 'bc', name: 'Buntrock Commons'}),
	makeBuilding({id: 'thecage', name: 'The Cage', parent: 'bc'}),
]
const venues = [venue('OSA', 'office', 'bc'), venue('The Cage', 'space', 'thecage')]

const directories = [
	{
		building: 'bc',
		floors: [
			{
				name: '1st floor',
				entries: [
					{name: 'OSA', room: '110'},
					{name: 'Mail Room', room: '120'},
				],
			},
		],
	},
]

const buntrock: StackEntry = {kind: 'feature', id: 'bc'}
const theCage: StackEntry = {kind: 'feature', id: 'thecage'}

const trackedQueryClients: QueryClient[] = []

afterEach(() => {
	for (let client of trackedQueryClients) {
		client.clear()
	}
	trackedQueryClients.length = 0
})

async function renderStack(stack: Array<StackEntry>, dispatch = jest.fn()) {
	let client = new QueryClient({defaultOptions: {queries: {retry: false, staleTime: Infinity}}})
	trackedQueryClients.push(client)
	client.setQueryData(mapKeys.all('stolaf'), features)
	client.setQueryData(hoursKeys.all('stolaf'), venues)
	client.setQueryData(directoryKeys.all('stolaf'), directories)
	await render(
		<QueryClientProvider client={client}>
			<PlaceStackCard campus="stolaf" depth={0} dispatch={dispatch} stack={stack} stop="medium" />
		</QueryClientProvider>,
	)
	return dispatch
}

function titles() {
	return screen.getAllByTestId('card-title').map((title) => title.props.children)
}

describe('PlaceStackCard', () => {
	test('shows one card for one place', async () => {
		await renderStack([buntrock])
		expect(titles()).toEqual(['Buntrock Commons'])
	})

	test('stacks the next place in a sheet over the card beneath', async () => {
		await renderStack([buntrock, theCage])
		expect(titles()).toEqual(['Buntrock Commons', 'The Cage'])
	})

	test('pops the stacked sheet when its card closes, or when swiped away', async () => {
		let dispatch = await renderStack([buntrock, theCage])
		await fireEvent.press(screen.getAllByLabelText('Close')[1])
		expect(dispatch).toHaveBeenLastCalledWith({type: 'pop', depth: 1})

		await fireEvent.press(screen.getByLabelText('Dismiss'))
		expect(dispatch).toHaveBeenLastCalledWith({type: 'pop', depth: 1})
	})

	test('clears the stack when the first card closes', async () => {
		let dispatch = await renderStack([buntrock])
		await fireEvent.press(screen.getByLabelText('Close'))
		expect(dispatch).toHaveBeenCalledWith({type: 'clear'})
	})

	test("stacks a tile's place when it is tapped", async () => {
		let dispatch = await renderStack([buntrock])
		await fireEvent.press(screen.getByRole('button', {name: 'OSA'}))
		expect(dispatch).toHaveBeenCalledWith({type: 'push', entry: {kind: 'venue', name: 'OSA'}})
	})

	test("shows a venue's card", async () => {
		await renderStack([buntrock, {kind: 'venue', name: 'OSA'}])
		expect(screen.getByText('Office · Buntrock Commons')).toBeTruthy()
	})

	test('lists the page of a link merged with a stacked point', async () => {
		await renderStack([
			buntrock,
			{kind: 'feature', id: 'thecage', link: {label: 'The Cage', href: 'https://example.com/cage'}},
		])
		expect(screen.getByRole('button', {name: 'Open The Cage'})).toBeTruthy()
	})

	test('says so when a stacked venue is not in the Hours data', async () => {
		await renderStack([buntrock, {kind: 'venue', name: 'Nope'}])
		expect(screen.getByText('Place not found.')).toBeTruthy()
	})
})

// Each tile pushes a card that mounts its own observers; a feed already in
// the cache must not be refetched for each one.
describe('PlaceStackCard caching', () => {
	test('reads the cached feeds without refetching them', async () => {
		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		trackedQueryClients.push(client)
		client.setQueryData(mapKeys.all('stolaf'), features)
		client.setQueryData(hoursKeys.all('stolaf'), venues)
		client.setQueryData(directoryKeys.all('stolaf'), directories)
		await render(
			<QueryClientProvider client={client}>
				<PlaceStackCard
					campus="stolaf"
					depth={0}
					dispatch={jest.fn()}
					stack={[buntrock, theCage]}
					stop="medium"
				/>
			</QueryClientProvider>,
		)

		expect(client.getQueryState(hoursKeys.all('stolaf'))?.fetchStatus).toBe('idle')
		expect(client.getQueryState(mapKeys.all('stolaf'))?.fetchStatus).toBe('idle')
		expect(client.getQueryState(hoursKeys.all('stolaf'))?.dataUpdateCount).toBe(1)
		expect(client.getQueryState(mapKeys.all('stolaf'))?.dataUpdateCount).toBe(1)
		expect(client.getQueryState(directoryKeys.all('stolaf'))?.dataUpdateCount).toBe(1)
	})
})

describe('PlaceStackCard floors', () => {
	const floor: StackEntry = {kind: 'floor', building: 'bc', floor: 0}

	test("stacks a floor's sheet, titled for the floor", async () => {
		await renderStack([buntrock, floor])
		expect(titles()).toEqual(['Buntrock Commons', '1st floor'])
	})

	test("stacks an entry's card when it opens one", async () => {
		let dispatch = await renderStack([buntrock, floor])
		// Buntrock's card beneath lists OSA too; the floor's row reads its room.
		await fireEvent.press(screen.getByRole('button', {name: 'OSA, 110'}))
		expect(dispatch).toHaveBeenCalledWith({type: 'push', entry: {kind: 'venue', name: 'OSA'}})
	})

	test('a row that opens nothing is not a button', async () => {
		await renderStack([buntrock, floor])
		expect(screen.getByText('Mail Room')).toBeTruthy()
		expect(screen.queryByRole('button', {name: /^Mail Room/u})).toBeNull()
	})

	test('says so when the floor is gone', async () => {
		await renderStack([buntrock, {kind: 'floor', building: 'bc', floor: 5}])
		expect(screen.getByText('Floor not found.')).toBeTruthy()
	})
})
