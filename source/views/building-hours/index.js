// @flow
/**
 * All About Olaf
 * Building Hours view. This component loads data from either GitHub or
 * the local copy as a fallback, and renders the list of buildings.
 */

import React from 'react'
import {NoticeView} from '../components/notice'
import {BuildingHoursList} from './list'
import {
  fetchGoogleCalendar,
  type GoogleResponseType,
  type GoogleEventType,
} from '../../lib/calendar'
import mapValues from 'lodash/mapValues'
import sortBy from 'lodash/sortBy'

import type momentT from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {
  ScheduleType,
  BuildingGroupType,
  BuildingType,
  DayScheduleType,
} from './types'
import groupBy from 'lodash/groupBy'
import fromPairs from 'lodash/fromPairs'
import toPairs from 'lodash/toPairs'

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

export {BuildingHoursDetailView} from './detail'

export class BuildingHoursView extends React.Component {
  state: {
    error: ?Error,
    loading: boolean,
    now: momentT,
    buildings: BuildingGroupType,
    intervalId: number,
  } = {
    error: null,
    loading: true,
    // now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
    now: moment.tz(CENTRAL_TZ),
    buildings: {},
    intervalId: 0,
  }

  componentWillMount() {
    this.fetchData()

    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 10000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  props: TopLevelViewPropsType

  updateTime = () => {
    this.setState({now: moment.tz(CENTRAL_TZ)})
  }

  fetchData = async () => {
    this.setState({loading: true})

    const processSchedule = (ev: GoogleEventType): DayScheduleType => {
      let sched = {
        open: moment(ev.start.date || ev.start.dateTime || null),
        close: moment(ev.end.date || ev.end.dateTime || null),
        title: ev.summary || '',
        location: ev.location || '',
        notes: ev.description || '',
      }

      const tagRegex = /\[.*?\]/g
      const tagLabels = sched.title.match(tagRegex)
      const name = sched.title.replace(tagRegex, '').trim()

      const tags = (tagLabels || [])
        .map(t => t.replace(/\[|\]/g, ''))
        .map(t => (/^no-/.test(t) ? [t.substr(3), false] : [t, true]))

      return {...sched, title: name, tags: fromPairs(tags)}
    }

    const groupSchedules = (scheds: DayScheduleType[]): ScheduleType[] => {
      return toPairs(
        groupBy(scheds, ev => ev.title),
      ).map(([name, instances]) => ({name, instances}))
    }

    const processCal = (
      cal: GoogleResponseType,
    ): [string, BuildingGroupType] => {
      console.log(cal)
      const unsortedSchedules = (cal.items || []).map(processSchedule)

      // start out by sorting the schedules by their opening datetime
      const sortedSchedules = sortBy(unsortedSchedules, sched => sched.open)

      // now group them by building
      const groupedByBuilding = groupBy(
        sortedSchedules,
        sched => sched.location,
      )

      // and we group the building's schedules by name
      const processed: {
        [key: string]: BuildingType[],
      } = mapValues(groupedByBuilding, (group): BuildingType => ({
        name: group[0].location,
        category: cal.summary || 'Other',
        schedules: groupSchedules(group),
      }))

      // now we inline the calendar-level info
      return [cal.summary || 'Other', processed]
    }

    const calendars = [
      'stolaf.edu_han03jf2oah16g2eg7i87fc9es@group.calendar.google.com', // academia
      'stolaf.edu_b1rs4gnuc17rnkq21eh3ktb7oo@group.calendar.google.com', // food
      'stolaf.edu_adh3lk6f8td9svn6tctd5udsr8@group.calendar.google.com', // gym
      'stolaf.edu_5u87kfk7m9eot6ohak84qqfk0g@group.calendar.google.com', // health and wellness
      'stolaf.edu_eldo9isc0k3mugmsgolfeks764@group.calendar.google.com', // help and support
      'stolaf.edu_c10nm0jofr4u9t09i136uif8d8@group.calendar.google.com', // libraries
      'stolaf.edu_rcghiqu97v4qk3doqcncffrlq4@group.calendar.google.com', // mail and packages
      'stolaf.edu_utd4m8oi9m6njmvmis653eo25o@group.calendar.google.com', // offices
      'stolaf.edu_96t9qr676d1ad3mn6urr4o5s8c@group.calendar.google.com', // supplies and books
    ]

    const fetchCal = id =>
      fetchGoogleCalendar(id, {
        maxResults: 1000,
        timeMin: moment()
          .startOf('day')
          .startOf('week')
          .subtract(1, 'w')
          .toISOString(),
        timeMax: moment()
          .startOf('day')
          .startOf('week')
          .add(1, 'w')
          .toISOString(),
      })

    const getCal = id => fetchCal(id).then(processCal)

    const grouped = fromPairs(await Promise.all(calendars.map(getCal)))

    console.log(grouped)

    this.setState({
      loading: false,
      buildings: grouped,
      now: moment.tz(CENTRAL_TZ),
    })
  }

  render() {
    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error.message} />
    }

    return (
      <BuildingHoursList
        route={this.props.route}
        navigator={this.props.navigator}
        buildings={this.state.buildings}
        now={this.state.now}
        onRefresh={this.fetchData}
        loading={this.state.loading}
      />
    )
  }
}
