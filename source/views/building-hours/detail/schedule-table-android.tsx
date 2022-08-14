import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import {Card} from '@frogpond/silly-card'
import type {Moment} from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'
import {isScheduleOpenAtMoment, getDayOfWeek} from '../lib'
import {ScheduleRow} from './schedule-row'
import {ButtonCell} from '@frogpond/tableview/cells'

type Props = {
	now: Moment
	schedules: NamedBuildingScheduleType[]
	onProblemReport: () => void
}

export const ScheduleTable = (props: Props): JSX.Element => {
	let {now, schedules, onProblemReport} = props
	let dayOfWeek = getDayOfWeek(now)

	return (
		<View>
			{schedules.map((schedule) => (
				<Card
					key={schedule.title}
					footer={schedule.notes}
					header={schedule.title}
					style={styles.scheduleContainer}
				>
					{schedule.hours.map((set, i) => (
						<ScheduleRow
							key={i}
							isActive={
								schedule.isPhysicallyOpen !== false &&
								set.days.includes(dayOfWeek) &&
								isScheduleOpenAtMoment(set, now)
							}
							now={now}
							set={set}
						/>
					))}
				</Card>
			))}

			<Card style={styles.scheduleContainer}>
				<ButtonCell onPress={onProblemReport} title="Suggest an Edit" />
			</Card>
		</View>
	)
}

const styles = StyleSheet.create({
	scheduleContainer: {
		marginBottom: 20,
	},
})
