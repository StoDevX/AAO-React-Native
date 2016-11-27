// @flow
import {normalizeBuildingSchedule} from '../building-hours-helpers'

test('turns a list of SingleBuildingScheduleType into a NamedBuildingScheduleType', () => {
  let schedules = [
    {days: ['Mo'], from: '7:30am', to: '8:00pm'},
    {days: ['Su'], from: '9:00am', to: '8:00pm'},
  ]
  let input = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    schedule: schedules,
  }

  const expected = [{
    title: 'Hours',
    hours: schedules,
  }]

  expect(normalizeBuildingSchedule(input)).toEqual(expected)
})

test('returns a NamedBuildingScheduleType unchanged', () => {
  const schedules = [
    {
      title: 'Hours1',
      hours: [
        {days: ['Mo'], from: '7:30am', to: '8:00pm'},
        {days: ['Su'], from: '9:00am', to: '8:00pm'},
      ],
    },
  ]
  let input = {
    name: 'building',
    category: '???',
    breakSchedule: {},
    namedSchedule: schedules,
  }

  const expected = schedules

  expect(normalizeBuildingSchedule(input)).toEqual(expected)
})
