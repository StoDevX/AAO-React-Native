/**
 * @flow
 *
 * <ScheduleTable/> renders the table of schedules.
 */

import React from 'react'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import moment from 'moment-timezone'
import type {NamedBuildingScheduleType, DayOfWeekEnumType} from '../types'
import {isBuildingOpenAtMoment} from '../building-hours-helpers'
import {ScheduleRow} from './schedule-row'

export class ScheduleTable extends React.PureComponent {
  props: {
    now: moment,
    schedules: NamedBuildingScheduleType[],
    onProblemReport: () => any,
  }

  render() {
    const {now, schedules, onProblemReport} = this.props
    const dayOfWeek = ((now.format('dd'): any): DayOfWeekEnumType)

    return (
      <TableView>
        {schedules.map(set =>
          <Section
            key={set.title}
            header={set.title.toUpperCase()}
            footer={set.notes}
          >
            {set.hours.map((schedule, i) =>
              <ScheduleRow
                key={i}
                now={now}
                schedule={schedule}
                isActive={
                  set.isPhysicallyOpen !== false &&
                  schedule.days.includes(dayOfWeek) &&
                  isBuildingOpenAtMoment(schedule, now)
                }
              />,
            )}
          </Section>,
        )}

        <Section>
          <Cell
            accessory="DisclosureIndicator"
            title="Report a Problem"
            onPress={onProblemReport}
          />
        </Section>
      </TableView>
    )
  }
}
