/**
 * @flow
 *
 * <ScheduleTable/> renders the table of schedules.
 */

import React from 'react'
import {TableView, Section} from 'react-native-tableview-simple'
import moment from 'moment-timezone'
import type {NamedBuildingScheduleType, DayOfWeekEnumType} from '../types'
import {isBuildingOpenAtMoment} from '../building-hours-helpers'
import {ScheduleRow} from './schedule-row'

export class ScheduleTable extends React.PureComponent {
  props: {
    now: moment,
    schedules: NamedBuildingScheduleType[],
  }

  render() {
    const {now, schedules} = this.props
    const dayOfWeek = ((now.format('dd'): any): DayOfWeekEnumType)

    return (
      <TableView>
        {schedules.map(schedule =>
          <Section
            key={schedule.title}
            header={schedule.title.toUpperCase()}
            footer={schedule.notes}
          >
            {schedule.hours.map((set, i) =>
              <ScheduleRow
                key={i}
                now={now}
                set={set}
                isActive={
                  schedule.isPhysicallyOpen !== false &&
                  set.days.includes(dayOfWeek) &&
                  isBuildingOpenAtMoment(set, now)
                }
              />,
            )}
          </Section>,
        )}
      </TableView>
    )
  }
}
