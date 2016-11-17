import {getBuildingHours} from '../get-building-hours'
import moment from 'moment'

it('returns an {open, close} tuple', () => {
  let now = moment('Fri 10:01', 'dddd H:mm')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = getBuildingHours(input, now)

  expect(actual).toBeDefined()
  expect(actual.open).toBeDefined()
  expect(actual.close).toBeDefined()
})

it('returns false if the day is not provided', () => {
  let now = moment('Sat 10:01', 'dddd H:mm')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = getBuildingHours(input, now)

  expect(actual).toBe(false)
})
