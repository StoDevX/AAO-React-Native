// @flow
import {getStatusOfBuildingAtMoment} from '../building-hours-helpers'
import {dayMoment} from './moment.helper'

it('handles if a schedule is open', () => {
  let m = dayMoment('Fri 3:00pm')
  let schedule = {days: ['Fr'], from: '10:30am', to: '12:00am'}

  expect(getStatusOfBuildingAtMoment(schedule, m)).toBe('Open')
})

it('handles the minute the schedule opens', () => {
  let m = dayMoment('Fri 10:30am')
  let schedule = {days: ['Fr'], from: '10:30am', to: '12:00am'}

  expect(getStatusOfBuildingAtMoment(schedule, m)).toBe('Open')
})

it('returns the time remaining before the schedule opens', () => {
  let m = dayMoment('Fri 10:29:00am', 'ddd h:mm:ssa')
  let schedule = {days: ['Fr'], from: '10:30am', to: '12:00am'}

  expect(getStatusOfBuildingAtMoment(schedule, m)).toBe('Opens in a minute')
})

it('returns the time remaining before the schedule closes', () => {
  let m = dayMoment('Fri 11:55:00pm', 'ddd h:mm:ssa')
  let schedule = {days: ['Fr'], from: '10:30am', to: '12:00am'}

  expect(getStatusOfBuildingAtMoment(schedule, m)).toBe('Closes in 5 minutes')
})

it('handles after the schedule closes', () => {
  let m = dayMoment('Fri 1:01pm')
  let schedule = {days: ['Fr'], from: '10:30am', to: '1:00pm'}

  expect(getStatusOfBuildingAtMoment(schedule, m)).toBe('Closed')
})
