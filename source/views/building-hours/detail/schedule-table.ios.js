/**
 * @flow
 *
 * <ScheduleTable/> renders the table of schedules.
 */

import React from 'react'
import {TableView, Section} from 'react-native-tableview-simple'
import moment from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'
import {isScheduleOpenAtMoment, getDayOfWeek} from '../lib'
import {ScheduleRow} from './schedule-row'

export class ScheduleTable extends React.PureComponent {
  props: {
    now: moment,
    schedules: NamedBuildingScheduleType[],
  }

  render() {
    const {now, schedules} = this.props
    const dayOfWeek = getDayOfWeek(now)

    return (
      <TableView>
        <Section>
          <Cell
            accessory="DisclosureIndicator"
            title="Suggest an Edit"
            onPress={onProblemReport}
          />
        </Section>

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
                  isScheduleOpenAtMoment(schedule, now)
                }
              />,
            )}
          </Section>,
        )}
      </TableView>
    )
  }
}
