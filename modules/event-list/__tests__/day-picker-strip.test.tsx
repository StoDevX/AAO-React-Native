import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'

import {deriveDays} from '../day-picker-strip'
import type {SourcedEvent} from '../types'

const NOW = moment('2026-08-23T12:00:00Z')

describe('deriveDays', () => {
	test('returns empty array when events is empty', () => {
		let result = deriveDays([], NOW)
		expect(result).toEqual([])
	})

	test('returns today when only today has events', () => {
		let events = [
			{
				sourceId: 'a',
				key: 'k',
				event: {startTime: moment('2026-08-23T14:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(1)
		expect(result[0].isSame(NOW, 'day')).toBe(true)
	})

	test('returns days in order starting from today', () => {
		let events = [
			{
				sourceId: 'a',
				key: '1',
				event: {startTime: moment('2026-08-25T10:00:00Z'), isOngoing: false},
			},
			{
				sourceId: 'a',
				key: '2',
				event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false},
			},
			{
				sourceId: 'a',
				key: '3',
				event: {startTime: moment('2026-08-24T10:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(3)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
		expect(result[1].format('YYYY-MM-DD')).toBe('2026-08-24')
		expect(result[2].format('YYYY-MM-DD')).toBe('2026-08-25')
	})

	test('excludes days before today', () => {
		let events = [
			{
				sourceId: 'a',
				key: '1',
				event: {startTime: moment('2026-08-22T10:00:00Z'), isOngoing: false},
			},
			{
				sourceId: 'a',
				key: '2',
				event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(1)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
	})

	test('excludes ongoing events from day derivation', () => {
		let events = [
			{
				sourceId: 'a',
				key: '1',
				event: {startTime: moment('2026-08-20T10:00:00Z'), isOngoing: true},
			},
			{
				sourceId: 'a',
				key: '2',
				event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(1)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
	})

	test('deduplicates days with multiple events', () => {
		let events = [
			{
				sourceId: 'a',
				key: '1',
				event: {startTime: moment('2026-08-23T09:00:00Z'), isOngoing: false},
			},
			{
				sourceId: 'a',
				key: '2',
				event: {startTime: moment('2026-08-23T14:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(1)
	})
})
