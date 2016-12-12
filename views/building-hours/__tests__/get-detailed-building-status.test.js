// @flow
import {getDetailedBuildingStatus} from '../building-hours-helpers'
import {dayMoment} from './moment.helper'

it('returns a list of [isOpen, scheduleName, verboseStatus] tuples', () => {
  let m = dayMoment('Fri 1:00pm')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [{
      title: 'Hours',
      hours: [
        {days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '12:00am'},
        {days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'},
        {days: ['Su'], from: '10:30am', to: '12:00am'},
      ],
    }],
  }

  const actual = getDetailedBuildingStatus(building, m)

  expect(actual).toBeInstanceOf(Array)
  expect(actual.length).toEqual(1)
  expect(actual[0]).toBeInstanceOf(Array)
  expect(actual[0].length).toBe(3)
  expect(typeof actual[0][0]).toBe('boolean')
  expect(typeof actual[0][1]).toBe('string')
  expect(typeof actual[0][2]).toBe('string')

  expect(actual).toMatchSnapshot()
})

it('checks a list of schedules to see if any are open', () => {
  let m = dayMoment('Fri 1:00pm')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [{
      title: 'Hours',
      hours: [
        {days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '12:00am'},
        {days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'},
        {days: ['Su'], from: '10:30am', to: '12:00am'},
      ],
    }],
  }

  const actual = getDetailedBuildingStatus(building, m)
  expect(actual).toMatchSnapshot()

  expect(actual[0][0]).toBe(true)
})

it('handles multiple internal schedules for the same timeframe', () => {
  let m = dayMoment('Mon 1:00pm')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [{
      title: 'Hours',
      hours: [
        {days: ['Mo'], from: '10:30am', to: '12:00pm'},
        {days: ['Mo'], from: '1:00pm', to: '3:00pm'},
      ],
    }],
  }

  const actual = getDetailedBuildingStatus(building, m)
  expect(actual).toMatchSnapshot()

  expect(actual[0][0]).toBe(false)
  expect(actual[1][0]).toBe(true)
})

it('handles multiple named schedules for the same timeframe', () => {
  let m = dayMoment('Mon 1:00pm')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [
      {
        title: 'Hours',
        hours: [
          {days: ['Mo'], from: '10:30am', to: '12:00pm'},
        ],
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

  expect(actual[0][0]).toBe(false)
  expect(actual[1][0]).toBe(false)
  expect(actual[2][0]).toBe(true)
})

it('returns false if none are available for this day', () => {
  let m = dayMoment('Sun 1:00pm')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [{
      title: 'Hours',
      hours: [
        {days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '12:00am'},
        {days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'},
      ],
    }],
  }

  const actual = getDetailedBuildingStatus(building, m)
  expect(actual).toMatchSnapshot()

  expect(actual[0][0]).toBe(false)
})


it('returns false if none are open', () => {
  let m = dayMoment('Mon 3:00pm')
  let building = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: [{
      title: 'Hours',
      hours: [
        {days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '2:00pm'},
        {days: ['Fr', 'Sa'], from: '10:30am', to: '2:00pm'},
      ],
    }],
  }

  const actual = getDetailedBuildingStatus(building, m)
  expect(actual).toMatchSnapshot()

  expect(actual[0][0]).toBe(false)
})
