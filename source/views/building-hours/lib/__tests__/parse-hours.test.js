// @flow
import {parseHours} from '../parse-hours'
import {dayMoment, hourMoment, moment} from './moment.helper'

it('returns an {open, close} tuple', () => {
  const now = hourMoment('10:01am')
  const input = {days: [], from: '10:00am', to: '4:00pm'}
  const actual = parseHours(input, now)

  expect(actual).toBeDefined()
  expect(actual.open).toBeDefined()
  expect(actual.close).toBeDefined()
})

it('returns a Moment for .open', () => {
  const now = hourMoment('10:01am')
  const input = {days: [], from: '10:00am', to: '4:00pm'}
  const {open} = parseHours(input, now)
  expect(moment.isMoment(open)).toBe(true)
})

it('returns a Moment for .close', () => {
  const now = hourMoment('10:01am')
  const input = {days: [], from: '10:00am', to: '4:00pm'}
  const {close} = parseHours(input, now)
  expect(moment.isMoment(close)).toBe(true)
})

it('will add a day to the close time with nextDay:true', () => {
  const now = hourMoment('10:01am')
  const input = {days: [], from: '10:00am', to: '2:00am'}
  const {open, close} = parseHours(input, now)

  expect(close.isAfter(open)).toBe(true)
  expect(close.isAfter(now)).toBe(true)
})

describe('handles wierd times', () => {
  it('handles Friday at 4:30pm', () => {
    const now = dayMoment('Fri 4:30pm')
    const input = {days: [], from: '10:00am', to: '2:00am'}
    const {open, close} = parseHours(input, now)

    expect(now.isBetween(open, close)).toBe(true)
  })

  it('handles Saturday at 1:30am', () => {
    const now = dayMoment('Sat 1:30am')
    const input = {days: [], from: '10:00am', to: '2:00am'}
    const {open, close} = parseHours(input, now)

    expect(now.isBetween(open, close)).toBe(true)
  })
})
