// @flow
import {parseHours} from '../building-hours-helpers'
import {dayMoment, hourMoment, moment} from './moment.helper'

it('returns an {open, close} tuple', () => {
  let now = hourMoment('10:01am')
  let input = {days: [], from: '10:00am', to: '4:00pm'}
  let actual = parseHours(input, now)

  expect(actual).toBeDefined()
  expect(actual.open).toBeDefined()
  expect(actual.close).toBeDefined()
})

it('returns a Moment for .open', () => {
  let now = hourMoment('10:01am')
  let input = {days: [], from: '10:00am', to: '4:00pm'}
  let {open} = parseHours(input, now)
  expect(moment.isMoment(open)).toBe(true)
})

it('returns a Moment for .close', () => {
  let now = hourMoment('10:01am')
  let input = {days: [], from: '10:00am', to: '4:00pm'}
  let {close} = parseHours(input, now)
  expect(moment.isMoment(close)).toBe(true)
})

it('will add a day to the close time with nextDay:true', () => {
  let now = hourMoment('10:01am')
  let input = {days: [], from: '10:00am', to: '2:00am'}
  let {open, close} = parseHours(input, now)

  expect(close.isAfter(open)).toBe(true)
  expect(close.isAfter(now)).toBe(true)
})

describe('handles wierd times', () => {
  it('handles Friday at 4:30pm', () => {
    let now = dayMoment('Fri 4:30pm')
    let input = {days: [], from: '10:00am', to: '2:00am'}
    let {open, close} = parseHours(input, now)

    expect(now.isBetween(open, close)).toBe(true)
  })

  it('handles Saturday at 1:30am', () => {
    let now = dayMoment('Sat 1:30am')
    let input = {days: [], from: '10:00am', to: '2:00am'}
    let {open, close} = parseHours(input, now)

    expect(now.isBetween(open, close)).toBe(true)
  })
})
