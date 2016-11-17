// @flow
import {parseBuildingHours} from '../get-building-hours'
import moment from 'moment'

it('returns an {open, close} tuple', () => {
  let now = moment('10:01', 'H:mm')
  let input = ['10:00', '16:00']
  let actual = parseBuildingHours(input, now)

  expect(actual).toBeDefined()
  expect(actual.open).toBeDefined()
  expect(actual.close).toBeDefined()
})

it('returns a Moment for .open', () => {
  let now = moment('10:01', 'H:mm')
  let input = ['10:00', '16:00']
  let {open} = parseBuildingHours(input, now)
  expect(moment.isMoment(open)).toBe(true)
})

it('returns a Moment for .close', () => {
  let now = moment('10:01', 'H:mm')
  let input = ['10:00', '16:00']
  let {close} = parseBuildingHours(input, now)
  expect(moment.isMoment(close)).toBe(true)
})

it('will add a day to the close time with nextDay:true', () => {
  let now = moment('10:01', 'H:mm')
  let input = ['10:00', '16:00', {nextDay: true}]
  let {open, close} = parseBuildingHours(input, now)

  expect(close.isAfter(open)).toBe(true)
  expect(close.isAfter(now)).toBe(true)
})

describe('handles wierd times', () => {
  it('handles Friday at 4:30pm', () => {
    let now = moment('Fri 16:30', 'dddd H:mm')
    let input = ['10:00', '2:00', {nextDay: true}]
    let {open, close} = parseBuildingHours(input, now)

    expect(now.isBetween(open, close)).toBe(true)
  })

  xit('handles Saturday at 1:30am', () => {
    let now = moment('Sat 1:30', 'dddd H:mm')
    let input = ['10:00', '2:00', {nextDay: true}]
    let {open, close} = parseBuildingHours(input, now)

    expect(now.isBetween(open, close)).toBe(true)
  })
})
