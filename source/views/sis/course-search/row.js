// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {CourseType} from '../../../lib/course-search/types'
import {ListRow, Title, Detail} from '@frogpond/lists'
import {deptNum} from './lib/format-dept-num'
import moment from 'moment-timezone'
import {convertTimeStringsToOfferings} from 'sto-sis-time-parser'
import {formatDayAbbrev} from './lib/format-day'
import sortBy from 'lodash/sortBy'
import {Row} from '@frogpond/layout'
const CENTRAL_TZ = 'America/Winnipeg'
const fmt = 'h:mm A'

type Props = {
	course: CourseType,
	onPress: CourseType => any,
}

export class CourseRow extends React.PureComponent<Props> {
	onPress = () => {
		this.props.onPress(this.props.course)
	}

	render() {
		const {course} = this.props
		const groupings = convertTimeStringsToOfferings(course, {groupBy: 'sis'})
		const formattedGroupings = groupings.map(grouping => {
			const times = grouping.times
				.map(time => {
					const start = moment.tz(time.start, 'hmm', CENTRAL_TZ).format(fmt)
					const end = moment.tz(time.end, 'hmm', CENTRAL_TZ).format(fmt)
					return `${start} – ${end}`
				})
				.join(', ')
			const dayOrder = ['Mo', 'Tu', 'We', 'Th', 'Fr']
			let days = sortBy(grouping.days, d => dayOrder.indexOf(d))
				.map(formatDayAbbrev)
				.join('')
			if (days === 'MTWThF') {
				days = 'M-F'
			}
			return `${days} ${times}`
		})

		return (
			<ListRow arrowPosition="center" onPress={this.onPress}>
				<Title lines={1}>{course.name}</Title>

				<Row>
					<Detail style={styles.bold}>{deptNum(course)}</Detail>

					{course.gereqs && (
						<Detail style={styles.ges}>({course.gereqs.join(', ')})</Detail>
					)}
				</Row>

				{course.instructors && (
					<Detail style={styles.row}>{course.instructors.join(', ')}</Detail>
				)}

				{course.notes && (
					<Detail lines={1} style={[styles.italics, styles.row]}>
						{course.notes.join(' ')}
					</Detail>
				)}

				{course.times && <Detail>{formattedGroupings.join('\n')}</Detail>}
			</ListRow>
		)
	}
}

const styles = StyleSheet.create({
	bold: {
		fontWeight: 'bold',
	},
	italics: {
		fontStyle: 'italic',
	},
	ges: {
		marginLeft: 4,
	},
	row: {
		marginTop: -4,
	},
})
