// @flow

import * as React from 'react'
import {Text, StyleSheet} from 'react-native'
import type {CourseType} from '../../../lib/course-search/types'
import {ListRow, Title} from '../../components/list'
import {Row} from '../../components/layout'
import {deptNum} from './'
import moment from 'moment-timezone'
import {convertTimeStringsToOfferings} from 'sto-sis-time-parser'
import {formatDayAbbrev} from './lib/format-day'
const CENTRAL_TZ = 'America/Winnipeg'

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
		const groupings = convertTimeStringsToOfferings(
			{times: course.times},
			{groupBy: 'sis'},
		)
		const formattedGroupings = groupings.map(grouping => {
			const times = grouping.times
				.map(time => {
					const start = moment
						.tz(time.start, 'hmm', CENTRAL_TZ)
						.format('h:mm A')
					const end = moment.tz(time.end, 'hmm', CENTRAL_TZ).format('h:mm A')
					return `${start} - ${end}`
				})
				.join(', ')
			let days = grouping.days.map(day => formatDayAbbrev(day)).join('')
			if (days === 'MTWThF') {
				days = 'M-F'
			}
			return `${days} ${times}`
		})
		return (
			<ListRow arrowPosition="center" onPress={this.onPress}>
				<Row>
					<Title lines={1}>{course.name}</Title>
				</Row>
				<Text>
					<Text style={styles.bold}>{deptNum(course)}</Text>{' '}
					{course.gereqs && `(${course.gereqs.join(', ')})`}
				</Text>
				{course.instructors && <Text>{course.instructors.join(', ')}</Text>}
				{course.times && <Text>{formattedGroupings.join('\n')}</Text>}
			</ListRow>
		)
	}
}

const styles = StyleSheet.create({
	bold: {
		fontWeight: 'bold',
	},
})
