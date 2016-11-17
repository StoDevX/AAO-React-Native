// @flow
import {allBuildingHours} from '../all-building-hours'
import moment from 'moment'

it('returns an array of strings', () => {
  let now = moment('Fri 10:01', 'dddd H:mm')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = allBuildingHours(input, now)

  expect(actual).toBeDefined()
  expect(Array.isArray(actual)).toBe(true)
  expect(typeof actual[0]).toBe('string')
})

it('always returns an entry for each day of the week', () => {
  let now = moment('Fri 10:01', 'dddd H:mm')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = allBuildingHours(input, now)

  expect(actual.length).toBe(7)
})

it('turns a building hour object into a descriptive array of strings', () => {
  let now = moment('Fri 10:01', 'dddd H:mm')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = allBuildingHours(input, now)

  expect(actual[4]).toBe('Friday: 10:00 am – 4:00 pm')
})

it('sorts the resulting days Mo-Su', () => {
  let now = moment('Fri 10:01', 'dddd H:mm')
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
  let now = moment('Fri 10:01', 'dddd H:mm')
  let input = {
    name: 'Building',
    image: 'building',
    times: {hours: {}},
  }
  let actual = allBuildingHours(input, now)

  expect(actual[0].endsWith('Closed')).toBe(true)
})
