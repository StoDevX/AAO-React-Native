import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import {Column} from '@frogpond/layout'
import {Detail, ListRow, Title} from '@frogpond/lists'
import type {BusTimetableEntry} from '../types'
import * as c from '@frogpond/colors'
import {ProgressChunk} from './progress-chunk'
import {ScheduleTimes} from './times'
import {
	BusStateEnum,
	findBusStopStatus as findStopStatus,
	findRemainingDeparturesForStop as findRemainingDepartures,
} from '../lib'
import type {Moment} from 'moment'

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
	},
	skippingStopTitle: {
		color: c.tertiaryLabel,
	},
	skippingStopDetail: {},
	internalPadding: {
		paddingVertical: Platform.OS === 'ios' ? 8 : 15,
	},
	atStopTitle: {
		fontWeight: Platform.OS === 'ios' ? '500' : '600',
	},
	passedStopTitle: {
		color: c.secondaryLabel,
	},
})

type Props = {
	stop: BusTimetableEntry
	departureIndex: null | number
	now: Moment
	barColor: string
	currentStopColor: string
	isFirstRow: boolean
	isLastRow: boolean
	status: BusStateEnum
}

export function BusStopRow(props: Props): JSX.Element {
	let {
		barColor,
		currentStopColor,
		departureIndex,
		isFirstRow,
		isLastRow,
		now,
		stop,
		status: busStatus,
	} = props

	let stopStatus = findStopStatus({stop, busStatus, departureIndex, now})
	let times = findRemainingDepartures({stop, busStatus, departureIndex})

	let rowTextStyle = [
		stopStatus === 'skip' && styles.skippingStopTitle,
		stopStatus === 'after' && styles.passedStopTitle,
		stopStatus === 'at' && styles.atStopTitle,
	]

	return (
		<ListRow fullHeight={true} fullWidth={true} style={styles.row}>
			<ProgressChunk
				barColor={barColor}
				currentStopColor={currentStopColor}
				isFirstChunk={isFirstRow}
				isLastChunk={isLastRow}
				stopStatus={stopStatus}
			/>

			<Column flex={1} style={styles.internalPadding}>
				<Title bold={false} style={rowTextStyle}>
					{stop.name}
				</Title>
				<Detail lines={1}>
					<ScheduleTimes
						style={stopStatus === 'skip' && styles.skippingStopDetail}
						times={times}
					/>
				</Detail>
			</Column>
		</ListRow>
	)
}
