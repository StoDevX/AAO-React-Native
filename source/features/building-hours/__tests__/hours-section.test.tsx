import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import {List} from '@expo/ui/swift-ui'

import {HoursSection} from '../hours-section'
import {contextualStatus} from '../lib'
import type {BuildingType} from '../types'

// A Monday, mid-morning.
const NOW = moment('2026-09-28T10:00:00')

const holland: BuildingType = {
	name: 'Holland Hall',
	category: 'Academia',
	kind: 'building',
	building: 'hh',
	schedule: [
		{
			title: 'Hours',
			hours: [
				{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '7:00am', to: '10:00pm'},
				{days: ['Sa', 'Su'], from: '9:00am', to: '6:00pm'},
			],
		},
	],
}

const stav: BuildingType = {
	name: 'Stav Hall',
	category: 'Food',
	kind: 'space',
	schedule: [
		{title: 'Breakfast', hours: [{days: ['Mo'], from: '7:15am', to: '9:45am'}]},
		{
			title: 'Lunch',
			notes: 'Grill closes at 1.',
			hours: [{days: ['Mo'], from: '10:30am', to: '2:00pm'}],
		},
		{title: 'Dinner', hours: [{days: ['Mo'], from: '4:30pm', to: '8:00pm'}]},
	],
}

function renderSection(venue: BuildingType) {
	return render(
		<List>
			<HoursSection now={NOW} venue={venue} />
		</List>,
	)
}

// The Cage's shape: a first block titled "Hours", then one more.
const cage: BuildingType = {
	name: 'The Cage',
	category: 'Food',
	kind: 'space',
	schedule: [
		{title: 'Hours', hours: [{days: ['Mo'], from: '7:30am', to: '8:00pm'}]},
		{title: 'Continental Breakfast', hours: [{days: ['Su'], from: '10:00am', to: '11:30am'}]},
	],
}

describe('HoursSection', () => {
	test('heads a single block "Hours", with a row per day group', async () => {
		await renderSection(holland)
		expect(screen.getByText('Hours')).toBeTruthy()
		expect(screen.getByText('Weekdays')).toBeTruthy()
		expect(screen.getByText('Weekends')).toBeTruthy()
	})

	test('heads each of several blocks by its own title, under one status', async () => {
		await renderSection(stav)
		for (let title of ['Breakfast', 'Lunch', 'Dinner']) {
			expect(screen.getByText(title)).toBeTruthy()
		}
		expect(screen.getAllByText(/^(Open|Closed|Opens|Closes|Reopens)/u)).toHaveLength(1)
	})

	// The status speaks for the whole venue, not for its first block, so it
	// sits under its own "Hours" heading above them all.
	test('puts the status of several blocks under "Hours", before the first block', async () => {
		await renderSection(stav)
		let tree = JSON.stringify(screen.toJSON())
		let hours = tree.indexOf('"Hours"')
		let status = tree.indexOf(`"${contextualStatus(stav, NOW).long}"`)
		let breakfast = tree.indexOf('"Breakfast"')
		expect(hours).toBeGreaterThan(-1)
		expect(status).toBeGreaterThan(hours)
		expect(breakfast).toBeGreaterThan(status)
	})

	// Maps titles its week "Normal Hours" under the status; with several
	// blocks, each block's own heading names its week instead.
	test('titles a single week "Normal Hours"', async () => {
		await renderSection(holland)
		expect(screen.getByText('Normal Hours')).toBeTruthy()
	})

	test('leaves "Normal Hours" off when blocks name their own weeks', async () => {
		await renderSection(stav)
		expect(screen.queryByText('Normal Hours')).toBeNull()
	})

	// Between breakfast and lunch, the status reads "Opens at 10:30 AM", so the
	// times beside it are lunch's, not the breakfast that has already ended.
	test("puts the next window's times beside the status", async () => {
		await renderSection(stav)
		let row = JSON.stringify(screen.toJSON())
		let statusAt = row.indexOf(`"${contextualStatus(stav, NOW).long}"`)
		let lunchAt = row.indexOf('"10:30 AM — 2 PM"', statusAt)
		let breakfastAt = row.indexOf('"Breakfast"')
		expect(lunchAt).toBeGreaterThan(statusAt)
		expect(lunchAt).toBeLessThan(breakfastAt)
	})

	// A first block titled "Hours" shares the status's section, rather than
	// heading its own with the same word straight after.
	test('heads the status and a first block titled "Hours" once', async () => {
		await renderSection(cage)
		expect(screen.getAllByText('Hours')).toHaveLength(1)
		expect(screen.getByText('Continental Breakfast')).toBeTruthy()
		let tree = JSON.stringify(screen.toJSON())
		expect(tree.indexOf('"Normal Hours"')).toBeGreaterThan(tree.indexOf('"Hours"'))
		expect(tree.indexOf('"Continental Breakfast"')).toBeGreaterThan(tree.indexOf('"Normal Hours"'))
	})

	test('shows a note under its block', async () => {
		await renderSection(stav)
		expect(screen.getByText('Grill closes at 1.')).toBeTruthy()
	})

	// An unscheduled venue is not closed; it has only its note.
	test('shows a note, and no status, for a venue with no hours', async () => {
		await renderSection({
			...holland,
			schedule: [{title: 'Hours', notes: 'By appointment.', hours: []}],
		})
		expect(screen.getByText('By appointment.')).toBeTruthy()
		expect(screen.queryByText(/^(Open|Closed|Opens)/u)).toBeNull()
	})

	test('draws nothing for a venue with neither hours nor a note', async () => {
		await renderSection({...holland, schedule: [{title: 'Hours', hours: []}]})
		expect(screen.queryByText('Hours')).toBeNull()
	})
})
