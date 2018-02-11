// @flow

import * as React from 'react'
import {Text, StyleSheet} from 'react-native'
import type {CourseType} from '../../../lib/course-search/types'
import {ListRow, Title} from '../../components/list'
import {Row} from '../../components/layout'
import {deptNum} from './'
import {findTime} from './lib/find-time'
import moment from 'moment-timezone'
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
		const times = course.times
			? course.times.map(time => {
					let array = time.split(/\s/)
					let cleanedTime = findTime(array[1])
					const start = moment
						.tz(cleanedTime.start, 'hmm', CENTRAL_TZ)
						.format('h:mm A')
					const end = moment
						.tz(cleanedTime.end, 'hmm', CENTRAL_TZ)
						.format('h:mm A')
					return `${array[0]} ${start} - ${end}`
				})
			: null
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
				{times && <Text>{times.join('\n')}</Text>}
			</ListRow>
		)
	}
}

const styles = StyleSheet.create({
	bold: {
		fontWeight: 'bold',
	},
})
