import * as React from 'react'
import {StyleProp, StyleSheet, Text, ViewStyle} from 'react-native'
import type {EventType} from '@frogpond/event-type'
import * as c from '@frogpond/colors'
import {Column, Row} from '@frogpond/layout'
import {Detail, ListRow, Title} from '@frogpond/lists'
import {Bar} from './vertical-bar'
import {times} from './times'

const styles = StyleSheet.create({
	row: {
		paddingVertical: 2,
	},
	rowInside: {
		minHeight: 46,
	},
	timeContainer: {
		width: 70,
		justifyContent: 'space-between',
		paddingVertical: 3,
	},
	bar: {
		marginHorizontal: 10,
	},
	time: {
		textAlign: 'right',
	},
	start: {
		color: c.label,
	},
	end: {
		color: c.secondaryLabel,
	},
	titleArea: {
		flex: 1,
		justifyContent: 'space-between',
		paddingBottom: 3,
		paddingTop: 2,
	},
})

type Props = {
	event: EventType
	onPress: (event: EventType) => void
}

export default class EventRow extends React.PureComponent<Props> {
	_onPress = (): void => this.props.onPress(this.props.event)

	render(): React.ReactElement {
		let {event} = this.props
		let title = event.title
		let subtitle = event[event.config.subtitle]?.trim()

		return (
			<ListRow
				arrowPosition="top"
				contentContainerStyle={styles.row}
				fullWidth={true}
				onPress={this._onPress}
			>
				<Row style={styles.rowInside}>
					<CalendarTimes event={event} style={styles.timeContainer} />

					<Bar style={styles.bar} />

					<Column style={styles.titleArea}>
						<Title>{title}</Title>
						{subtitle ? <Detail>{subtitle}</Detail> : null}
					</Column>
				</Row>
			</ListRow>
		)
	}
}

function CalendarTimes({
	event,
	style,
}: {
	event: EventType
	style: StyleProp<ViewStyle>
}) {
	let {allDay, start, end} = times(event)

	if (allDay) {
		return (
			<Column style={style}>
				<Text style={[styles.time, styles.start]}>all-day</Text>
			</Column>
		)
	}

	return (
		<Column style={style}>
			{event.config.startTime ? (
				<Text style={[styles.time, styles.start]}>{start}</Text>
			) : null}
			{event.config.endTime ? (
				<Text style={[styles.time, styles.end]}>{end}</Text>
			) : null}
		</Column>
	)
}
