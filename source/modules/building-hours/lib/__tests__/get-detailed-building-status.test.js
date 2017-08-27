// @flow
import {getDetailedBuildingStatus} from '../get-detailed-status'
import {plainMoment} from './moment.helper'

it('returns a list of [isOpen, scheduleName, verboseStatus] tuples', () => {
  let m = plainMoment('06-23-2017 1:00pm', 'MM-DD-YYYY h:mma')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [
      {
        title: 'Hours',
        hours: [
          {days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '12:00am'},
          {days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'},
          {days: ['Su'], from: '10:30am', to: '12:00am'},
        ],
      },
    ],
  }

  const actual = getDetailedBuildingStatus(building, m)

  expect(actual).toBeInstanceOf(Array)
  expect(actual.length).toEqual(1)
  expect(typeof actual[0].isActive).toBe('boolean')
  expect(typeof actual[0].label).toBe('string')
  expect(typeof actual[0].status).toBe('string')

  expect(actual).toMatchSnapshot()
})

it('checks a list of schedules to see if any are open', () => {
  let m = plainMoment('06-23-2017 1:00pm', 'MM-DD-YYYY h:mma')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [
      {
        title: 'Hours',
        hours: [
          {days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '12:00am'},
          {days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'},
          {days: ['Su'], from: '10:30am', to: '12:00am'},
        ],
      },
    ],
  }

  const actual = getDetailedBuildingStatus(building, m)
  expect(actual).toMatchSnapshot()

  expect(actual[0].isActive).toBe(true)
})

it('handles multiple internal schedules for the same timeframe', () => {
  let m = plainMoment('06-19-2017 1:00pm', 'MM-DD-YYYY h:mma')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [
      {
        title: 'Hours',
        hours: [
          {days: ['Mo'], from: '10:30am', to: '12:00pm'},
          {days: ['Mo'], from: '1:00pm', to: '3:00pm'},
        ],
      },
    ],
  }

  const actual = getDetailedBuildingStatus(building, m)
  expect(actual).toMatchSnapshot()

  expect(actual[0].isActive).toBe(false)
  expect(actual[1].isActive).toBe(true)
})

it('handles multiple named schedules for the same timeframe', () => {
  let m = plainMoment('06-19-2017 1:00pm', 'MM-DD-YYYY h:mma')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [
      {
        title: 'Hours',
        hours: [{days: ['Mo'], from: '10:30am', to: '12:00pm'}],
      },
      {
        title: 'Hours2',
        hours: [
          {days: ['Mo'], from: '10:30am', to: '12:00pm'},
          {days: ['Mo'], from: '1:00pm', to: '3:00pm'},
        ],
      },
    ],
  }

  const actual = getDetailedBuildingStatus(building, m)
  expect(actual).toMatchSnapshot()

  expect(actual[0].isActive).toBe(false)
  expect(actual[1].isActive).toBe(false)
  expect(actual[2].isActive).toBe(true)
})

it('returns false if none are available for this day', () => {
  let m = plainMoment('06-18-2017 1:00pm', 'MM-DD-YYYY h:mma')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [
      {
        title: 'Hours',
        hours: [
          {days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '12:00am'},
          {days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'},
        ],
      },
    ],
  }

  const actual = getDetailedBuildingStatus(building, m)
  expect(actual).toMatchSnapshot()

  expect(actual[0].isActive).toBe(false)
})

it('returns false if none are open', () => {
  let m = plainMoment('06-19-2017 3:00pm', 'MM-DD-YYYY h:mma')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [
      {
        title: 'Hours',
        hours: [
          {days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '2:00pm'},
          {days: ['Fr', 'Sa'], from: '10:30am', to: '2:00pm'},
        ],
      },
    ],
  }

  const actual = getDetailedBuildingStatus(building, m)
  expect(actual).toMatchSnapshot()

  expect(actual[0].isActive).toBe(false)
})
