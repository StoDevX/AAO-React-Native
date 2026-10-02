import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {CourseListItem} from '../../../database/courses/rows'
import {ListRow, Title, Detail} from '@frogpond/lists'
import {deptNum} from './lib/format-dept-num'
import {formatCourseNotes} from './lib/format-course-notes'
import {Row} from '@frogpond/layout'

type Props = {
	course: CourseListItem
	onPress: (course: CourseListItem) => void
}

export const CourseRow = (props: Props): React.ReactNode => {
	let {course} = props

	let onPress = (): void => {
		props.onPress(course)
	}

	return (
		<ListRow arrowPosition="center" onPress={onPress}>
			<Title lines={1}>{course.name}</Title>

			<Row>
				<Detail style={styles.bold}>{deptNum(course)}</Detail>

				{course.gereqs && <Detail style={styles.ges}>({course.gereqs.join(', ')})</Detail>}
			</Row>

			{course.instructors && <Detail style={styles.row}>{course.instructors.join(', ')}</Detail>}

			{course.notes && (
				<Detail lines={1} style={[styles.italics, styles.row]}>
					{formatCourseNotes(course.notes)}
				</Detail>
			)}
		</ListRow>
	)
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
