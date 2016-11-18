// @flow
import {allBuildingHours} from '../all-building-hours'
import {dayMoment} from './moment.helper'

it('returns an array of strings', () => {
  let now = dayMoment('Fri 10:01')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = allBuildingHours(input, now)

  expect(actual).toBeDefined()
  expect(Array.isArray(actual)).toBe(true)
  expect(typeof actual[0]).toBe('string')
})

it('always returns an entry for each day of the week', () => {
  let now = dayMoment('Fri 10:01')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = allBuildingHours(input, now)

  expect(actual.length).toBe(7)
})

it('turns a building hour object into a descriptive array of strings', () => {
  let now = dayMoment('Fri 10:01')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = allBuildingHours(input, now)

  expect(actual[4]).toBe('Friday: 10:00 am – 4:00 pm')
})

it('sorts the resulting days Mo-Su', () => {
  let now = dayMoment('Fri 10:01')
  let input = {
    name: 'Building',
    image: 'building',
    times: {hours: {
      'Mon': ['10:00', '16:00'],
      'Fri': ['10:00', '16:00'],
      'Sun': ['10:00', '16:00'],
    }},
  }
  let actual = allBuildingHours(input, now)

  expect(actual[0]).toBe('Monday: 10:00 am – 4:00 pm')
  expect(actual[4]).toBe('Friday: 10:00 am – 4:00 pm')
  expect(actual[6]).toBe('Sunday: 10:00 am – 4:00 pm')
})

it('returns the string "Closed" for any days where the building is closed', () => {
  let now = dayMoment('Fri 10:01')
  let input = {
    name: 'Building',
    image: 'building',
    times: {hours: {}},
  }
  let actual = allBuildingHours(input, now)

  expect(actual[0].endsWith('Closed')).toBe(true)
})
