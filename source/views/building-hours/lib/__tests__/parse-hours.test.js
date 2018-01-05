// @flow
import {parseHours} from '../parse-hours'
import {dayMoment, plainMoment, hourMoment, moment} from './moment.helper'

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
    // TODO: report a bug to moment-timezone that tz("Sat 1:30am", "ddd h:mma") is invalid (at least when `moment.now` = 2018-11-09)
    const saturday = '2018-11-11T01:30:00'
    const now = plainMoment(saturday, 'YYYY-MM-DD[T]HH:mm:ss')
    const input = {days: [], from: '10:00am', to: '2:00am'}
    const {open, close} = parseHours(input, now)

    expect(now.isBetween(open, close)).toBe(true)
  })
})

describe('checks a list of schedules to see if any are open', () => {
  const schedule = {days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'}

  it('in normal, non-dst situations', () => {
    const now = plainMoment('06-24-2018 12:00am', 'MM-DD-YYYY h:mma')
    const {open, close} = parseHours(schedule, now)
    expect(open.format('HH:mm')).toBe('10:30')
    expect(close.format('HH:mm')).toBe('02:00')
  })

  it('during the spring-forward dst', () => {
    const now = plainMoment('03-12-2018 12:00am', 'MM-DD-YYYY h:mma')
    const {open, close} = parseHours(schedule, now)
    expect(open.format('HH:mm')).toBe('10:30')
    expect(close.format('HH:mm')).toBe('01:00')
  })

  it('during the fall-back dst', () => {
    const now = plainMoment('11-4-2018 12:00am', 'MM-DD-YYYY h:mma')
    const {open, close} = parseHours(schedule, now)
    expect(open.format('HH:mm')).toBe('10:30')
    expect(close.format('HH:mm')).toBe('02:00')
  })
})
