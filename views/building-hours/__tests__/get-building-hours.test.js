import {getBuildingHours} from '../get-building-hours'
import {dayMoment} from './moment.helper'

it('returns an {open, close} tuple', () => {
  let now = dayMoment('Fri 10:01')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = getBuildingHours(input, now)

  expect(actual).toBeDefined()
  expect(actual.open).toBeDefined()
  expect(actual.close).toBeDefined()
})

it('returns false if the day is not provided', () => {
  let now = dayMoment('Sat 10:01')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = getBuildingHours(input, now)

  expect(actual).toBe(false)
})
