import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'

import type {BuildingType} from '../../building-hours/types'
import {buildDirectory, type HotlineMenu, type HotlineOption} from '../directory'

const noon = moment.tz('2026-11-02T12:00', 'America/Chicago')

function venue(name: string, category: string, extra: Partial<BuildingType> = {}): BuildingType {
	return {
		name,
		category,
		schedule: [{title: 'Hours', hours: [{days: ['Mo'], from: '8:00am', to: '5:00pm'}]}],
		...extra,
	}
}

const shut = {schedule: [{title: 'Hours', hours: []}]}

const buildings = [
	venue('Stav Hall', 'Food'),
	venue('The Cage', 'Food', shut),
	venue('Rølvaag Library', 'Libraries'),
	venue('Hidden Office', 'Offices', {listed: false}),
]

const halls = [{name: 'Stav Hall', specials: 'Specials at Stav.'}]

const labels = (menu: HotlineMenu) => menu.options.map((option) => option.label)

function submenu(option: HotlineOption | undefined): HotlineMenu {
	if (!option || !('options' in option.target)) {
		throw new Error(`${option?.label} is not a menu`)
	}
	return option.target
}

describe('buildDirectory', () => {
	test('offers specials, hours and what is open', () => {
		let root = buildDirectory({halls, buildings, now: noon})
		expect(labels(root)).toEqual([
			'the dining hall specials',
			'building hours',
			'everything open right now',
		])
		expect(submenu(root.options[0]).options).toEqual([
			{label: 'Stav Hall', target: {answer: 'Specials at Stav.'}},
		])
	})

	test('leaves specials out of a campus with no halls', () => {
		let root = buildDirectory({halls: [], buildings, now: noon})
		expect(labels(root)).toEqual(['building hours', 'everything open right now'])
	})

	test('lists listed venues by sorted category, in data order', () => {
		let hours = submenu(buildDirectory({halls, buildings, now: noon}).options[1])
		expect(labels(hours)).toEqual(['Food', 'Libraries'])
		let food = submenu(hours.options[0])
		expect(labels(food)).toEqual(['Stav Hall', 'The Cage'])
		expect(food.options[1].target).toEqual({answer: 'The Cage is closed today.'})
	})

	test('lists every open venue, listed or not, in data order', () => {
		let open = submenu(buildDirectory({halls, buildings, now: noon}).options[2])
		expect(labels(open)).toEqual([
			'Stav Hall, open until 5 p.m.',
			'Rølvaag Library, open until 5 p.m.',
			'Hidden Office, open until 5 p.m.',
		])
		expect(open.options[0].target).toEqual({
			answer: 'Stav Hall is open today from 8 a.m. to 5 p.m.',
		})
	})

	test('says so when nothing is open', () => {
		let late = moment.tz('2026-11-02T22:00', 'America/Chicago')
		let root = buildDirectory({halls, buildings, now: late})
		expect(root.options[2].target).toEqual({answer: 'Nothing is open right now.'})
	})
})
