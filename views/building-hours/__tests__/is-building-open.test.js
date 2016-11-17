// @flow
import {isBuildingOpen} from '../is-building-open'
import {dayMoment} from './moment.helper'

xit('returns "Open" if the building is open', () => {
  let now = dayMoment('Fri 10:01')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Open')
})

xit('returns "Closed" if the building is closed', () => {
  let now = dayMoment('Sat 10:01')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Closed')
})

xit('returns "Almost Closed" if the building closes within 30 minutes', () => {
  let now = dayMoment('Fri 15:31')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Almost Closed')
})

xit('returns "Closed" if the building is not open today', () => {
  let now = dayMoment('Mon 12:00')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Closed')
})
