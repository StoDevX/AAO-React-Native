import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import {BuildingList} from '../building-list'
import type {BuildingType} from '../../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/expo-ui-mock') as typeof import('../../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/expo-ui-mock') as typeof import('../../../../testing/expo-ui-mock')
})

const now = moment.tz('2026-09-07 14:00', 'America/Chicago') // Monday 2pm

function building(name: string): BuildingType {
	return {
		name,
		category: 'Academia',
		schedule: [
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		],
	}
}

function renderList(props: Partial<React.ComponentProps<typeof BuildingList>> = {}) {
	return render(
		<BuildingList
			favorites={[]}
			now={now}
			onSelect={jest.fn()}
			onToggleFavorite={jest.fn()}
			searchQuery=""
			sections={[{title: 'Academia', data: [building('Tomson Hall')]}]}
			{...props}
		/>,
	)
}

describe('which state the list shows', () => {
	test('lists the buildings it was given', async () => {
		let {queryByText} = await renderList()

		expect(queryByText('Tomson Hall')).not.toBeNull()
		expect(queryByText('No building hours available.')).toBeNull()
	})

	test('says the data is missing when there is no query behind the emptiness', async () => {
		let {queryByText} = await renderList({sections: [{title: 'Academia', data: []}]})

		expect(queryByText('No building hours available.')).not.toBeNull()
	})

	test('blames the query when one is what emptied the list', async () => {
		let {queryByText} = await renderList({
			searchQuery: 'zzz',
			sections: [{title: 'Academia', data: []}],
		})

		expect(queryByText('No results found for "zzz".')).not.toBeNull()
		expect(queryByText('No building hours available.')).toBeNull()
	})

	test('treats a whitespace-only query as no query at all', async () => {
		// `filterBuildings` ignores a blank query, so spaces typed over an empty
		// list must not be blamed for emptying it.
		let {queryByText} = await renderList({
			searchQuery: '   ',
			sections: [{title: 'Academia', data: []}],
		})

		expect(queryByText('No building hours available.')).not.toBeNull()
	})

	test('stays quiet while still loading', async () => {
		let {queryByText} = await renderList({
			isLoading: true,
			sections: [{title: 'Academia', data: []}],
		})

		expect(queryByText('No building hours available.')).toBeNull()
	})

	test('drops a section with nothing in it', async () => {
		let {queryByText} = await renderList({
			sections: [
				{title: 'Academia', data: [building('Tomson Hall')]},
				{title: 'Athletics', data: []},
			],
		})

		expect(queryByText('Academia')).not.toBeNull()
		expect(queryByText('Athletics')).toBeNull()
	})
})
