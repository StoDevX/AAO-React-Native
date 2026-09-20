import {expect, test} from '@jest/globals'
import {processBusLine, processBusSchedule} from '../process-bus-line'
import {time} from './moment.helper'
import {UnprocessedBusLine} from '../../types'
import moment from 'moment-timezone'

// prettier-ignore
const line: UnprocessedBusLine = {
  line: 'Blue Line',
  colors: {bar: 'rgb(103, 153, 170)', dot: 'rgb(13, 26, 35)'},
  schedules: [
    {
      days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
      coordinates: {
        'City Hall on Washington': [44.451472, -93.158529],
        'Family Fare': [44.453983, -93.159477],
      },
      stops: [
        'City Hall on Washington',
        'Family Fare',
      ],
      times: [
        ['6:00am', '6:01am'],
        ['6:45am', '6:46am'],
        ['7:30am', '7:31am'],
      ],
    },
  ],
}

test('processBusSchedule returns a timetable property', () => {
	let actual = processBusSchedule(time('12:00pm'))(line.schedules[0])
	expect('timetable' in actual).toBe(true)
})

test('processBusSchedule does not throw for a schedule with no coordinates key, as a hand-maintained line may have', () => {
	let {coordinates: _coordinates, ...scheduleWithoutCoordinates} = line.schedules[0]

	let process = () => processBusSchedule(time('12:00pm'))(scheduleWithoutCoordinates)

	expect(process).not.toThrow()

	let actual = process()
	for (let stop of actual.timetable) {
		expect(stop.coordinates).toBeUndefined()
	}
})

test("processBusLine parses times in the line's own timezone", () => {
	let now = moment.tz('2026-08-20 12:00', 'America/Chicago')
	let central = processBusLine({...line, timezone: 'America/Chicago'}, now)
	let eastern = processBusLine({...line, timezone: 'America/New_York'}, now)

	expect(central.schedules[0].times[0][0]?.valueOf()).not.toEqual(
		eastern.schedules[0].times[0][0]?.valueOf(),
	)
})

test("processBusLine carries the line's timezone through to its output, for getScheduleForNow and any other reader", () => {
	let now = moment.tz('2026-08-20 12:00', 'America/Chicago')
	let processed = processBusLine({...line, timezone: 'America/Chicago'}, now)

	expect(processed.timezone).toBe('America/Chicago')
})

test('processBusLine leaves timezone undefined for a hand-maintained line, as oles-go.yaml has none', () => {
	let now = moment.tz('2026-08-20 12:00', 'America/Chicago')
	let processed = processBusLine(line, now)

	expect(processed.timezone).toBeUndefined()
})

test('processBusLine falls back to the app timezone for a line without one, as oles-go.yaml has none', () => {
	let now = moment.tz('2026-08-20 12:00', 'America/Chicago')
	let withoutZone = processBusLine(line, now)
	let withCentral = processBusLine({...line, timezone: 'America/Chicago'}, now)

	expect(withoutZone.schedules[0].times[0][0]?.valueOf()).toEqual(
		withCentral.schedules[0].times[0][0]?.valueOf(),
	)
})
