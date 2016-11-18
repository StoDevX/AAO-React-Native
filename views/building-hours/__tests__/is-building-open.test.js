// @flow
import {isBuildingOpen} from '../is-building-open'
import {dayMoment} from './moment.helper'

it('returns "Open" if the building is open', () => {
  let now = dayMoment('Fri 10:01')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Open')
})

it('returns "Closed" if the building is closed', () => {
  let now = dayMoment('Fri 17:00')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Closed')
})

it('returns "Almost Closed" if the building closes within 30 minutes', () => {
  let now = dayMoment('Fri 15:31')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Almost Closed')
})

it('returns "Closed" if the building is not open today', () => {
  let now = dayMoment('Mon 12:00')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Closed')
})
