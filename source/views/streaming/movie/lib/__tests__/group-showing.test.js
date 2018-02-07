/* eslint-env jest */
// @flow

import {groupShowings} from '../group-showings'
import type {MovieShowing} from '../../types'

test('groups showings on the same day together', () => {
	const input: Array<MovieShowing> = [
		{time: '2017-01-01T00:00:00-06:00', location: 'Viking'},
		{time: '2017-01-01T06:00:00-06:00', location: 'Viking'},
		{time: '2017-01-01T12:00:00-06:00', location: 'Viking'},
		{time: '2017-01-01T18:00:00-06:00', location: 'Viking'},
	]

	const output = groupShowings(input)

	const expected = [
		{
			key: '1-jan-Viking',
			date: '1',
			month: 'jan',
			location: 'Viking',
			times: ['12am', '6am', '12pm', '6pm'],
		},
	]

	expect(output).toEqual(expected)
})

test('groups showings on different days together', () => {
	const input: Array<MovieShowing> = [
		{time: '2017-01-01T00:00:00-06:00', location: 'Viking'},
		{time: '2017-01-01T06:00:00-06:00', location: 'Viking'},
		{time: '2017-01-02T12:00:00-06:00', location: 'Viking'},
		{time: '2017-01-02T18:00:00-06:00', location: 'Viking'},
	]

	const output = groupShowings(input)

	const expected = [
		{
			key: '1-jan-Viking',
			date: '1',
			month: 'jan',
			location: 'Viking',
			times: ['12am', '6am'],
		},
		{
			key: '2-jan-Viking',
			date: '2',
			month: 'jan',
			location: 'Viking',
			times: ['12pm', '6pm'],
		},
	]

	expect(output).toEqual(expected)
})

test('groups showings by day, then by location', () => {
	const input: Array<MovieShowing> = [
		{time: '2017-01-01T00:00:00-06:00', location: 'Viking'},
		{time: '2017-01-01T06:00:00-06:00', location: 'Tomson'},
		{time: '2017-01-01T12:00:00-06:00', location: 'Viking'},
		{time: '2017-01-01T18:00:00-06:00', location: 'Tomson'},
	]

	const output = groupShowings(input)

	const expected = [
		{
			key: '1-jan-Viking',
			date: '1',
			month: 'jan',
			location: 'Viking',
			times: ['12am', '12pm'],
		},
		{
			key: '1-jan-Tomson',
			date: '1',
			month: 'jan',
			location: 'Tomson',
			times: ['6am', '6pm'],
		},
	]

	expect(output).toEqual(expected)
})

test('sorts showings lexiographically', () => {
	const input: Array<MovieShowing> = [
		{time: '2017-01-09T00:00:00-06:00', location: 'Viking'},
		{time: '2017-01-09T06:00:00-06:00', location: 'Viking'},
		{time: '2017-01-10T12:00:00-06:00', location: 'Viking'},
		{time: '2017-01-10T18:00:00-06:00', location: 'Viking'},
	]

	const output = groupShowings(input)

	const expected = [
		{
			key: '9-jan-Viking',
			date: '9',
			month: 'jan',
			location: 'Viking',
			times: ['12am', '6am'],
		},
		{
			key: '10-jan-Viking',
			date: '10',
			month: 'jan',
			location: 'Viking',
			times: ['12pm', '6pm'],
		},
	]

	expect(output).toEqual(expected)
})
