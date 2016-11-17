// @flow
import {isBuildingOpen} from '../is-building-open'
import moment from 'moment'

xit('returns "Open" if the building is open', () => {
  let now = moment('Fri 10:01', 'dddd H:mm')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Open')
})

xit('returns "Closed" if the building is closed', () => {
  let now = moment('Sat 10:01', 'dddd H:mm')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Closed')
})

xit('returns "Almost Closed" if the building closes within 30 minutes', () => {
  let now = moment('Fri 15:31', 'dddd H:mm')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Almost Closed')
})

xit('returns "Closed" if the building is not open today', () => {
  let now = moment('Mon 12:00', 'dddd H:mm')
  let input = {times: {hours: {'Fri': ['10:00', '16:00']}}, name: 'Building', image: 'building'}
  let actual = isBuildingOpen(input, now)

  expect(actual).toBe('Closed')
})
