// @flow

import * as React from 'react'
import {StyleSheet, Text, Platform} from 'react-native'
import type {CourseType} from '../../../../lib/course-search'
import glamorous from 'glamorous-native'
import {Badge} from '../../../building-hours/detail/badge'
import moment from 'moment-timezone'
import {formatDay} from '../lib/format-day'
import {
	TableView,
	Section,
	Cell,
	SelectableCell,
	MultiLineDetailCell,
	MultiLineLeftDetailCell,
} from '@frogpond/tableview'
import type {TopLevelViewPropsType} from '../../../types'
import * as c from '@frogpond/colors'
import {deptNum} from '../lib/format-dept-num'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import zip from 'lodash/zip'

const CENTRAL_TZ = 'America/Winnipeg'

const Container = glamorous.scrollView({
	paddingVertical: 6,
})

const Header = glamorous.text({
	fontSize: 36,
	textAlign: 'center',
	marginTop: 20,
	marginHorizontal: 10,
	color: c.black,
})

const SubHeader = glamorous.text({
	fontSize: 21,
	textAlign: 'center',
	marginTop: 5,
})

const styles = StyleSheet.create({
	chunk: {
		paddingVertical: 10,
	},
	time: {
		lineHeight: 20,
	},
	location: {
		fontStyle: 'italic',
		lineHeight: 20,
	},
	rightDetail: {
		color: c.iosDisabledText,
		textAlign: 'right',
	},
})

function Information({course}: {course: CourseType}) {
	return (
		<Section header="INFORMATION" sectionTintColor={c.sectionBgColor}>
			{course.instructors ? (
				<Cell
					cellStyle="LeftDetail"
					detail={
						course.instructors.length === 1 ? 'Instructor' : 'Instructors'
					}
					title={course.instructors.join(', ')}
				/>
			) : null}
			<Cell cellStyle="LeftDetail" detail="Type" title={course.type} />
			{course.gereqs ? (
				<Cell
					cellStyle="LeftDetail"
					detail="GEs"
					title={course.gereqs.join(', ')}
				/>
			) : null}
			{course.pn ? (
				<Cell
					cellStyle="LeftDetail"
					detail="Pass/Fail"
					title={course.pn ? 'Yes' : 'No'}
				/>
			) : null}
			<MultiLineLeftDetailCell
				detail="Prerequisites"
				title={course.prerequisites ? course.prerequisites : 'None'}
			/>
			{course.credits ? (
				<Cell cellStyle="LeftDetail" detail="Credits" title={course.credits} />
			) : null}
		</Section>
	)
}

function Schedule({course}: {course: CourseType}) {
	if (!course.offerings) {
		return null
	}
	const groupedByDay = groupBy(course.offerings, c => c.day)
	const schedule = map(groupedByDay, (offerings, day) => {
		const timesFormatted = offerings.map(offering => {
			const start = moment
				.tz(offering.start, 'H:mm', CENTRAL_TZ)
				.format('h:mm A')
			const end = moment.tz(offering.end, 'H:mm', CENTRAL_TZ).format('h:mm A')
			return `${start} – ${end}`
		})
		const locations = offerings.map(offering => offering.location)

		const timelocs = zip(timesFormatted, locations)

		const timelocsObj = timelocs.map(([time, location]) => ({time, location}))

		const rightDetail = timelocsObj.map(timeloc => (
			<Text key={timeloc.time} style={styles.rightDetail}>
				<Text style={styles.time}>{timeloc.time} </Text>
				<Text style={styles.location}>({timeloc.location})</Text>
			</Text>
		))

		return (
			<MultiLineDetailCell
				key={day}
				rightDetail={rightDetail}
				title={formatDay(day)}
			/>
		)
	})

	return (
		<Section header="SCHEDULE" sectionTintColor={c.sectionBgColor}>
			{schedule}
		</Section>
	)
}

function Description({course}: {course: CourseType}) {
	let descText = course.description ? course.description[0] : ''
	const description =
		Platform.OS === 'ios' ? (
			<SelectableCell text={descText} />
		) : (
			<Cell
				cellContentView={
					<Text selectable={true} style={styles.chunk}>
						{descText}
					</Text>
				}
			/>
		)

	return course.description ? (
		<Section header="DESCRIPTION">{description}</Section>
	) : null
}

type Props = TopLevelViewPropsType & {
	navigation: {state: {params: {course: CourseType}}},
}

export class CourseDetailView extends React.PureComponent<Props> {
	static navigationOptions = ({navigation}: any) => {
		const course = navigation.state.params.course
		return {
			title: course.name,
		}
	}

	render() {
		const course = this.props.navigation.state.params.course
		const status = course.status === 'O' ? 'Open' : 'Closed'
		return (
			<Container>
				<Header>{course.title || course.name}</Header>
				<SubHeader>{deptNum(course)}</SubHeader>
				<Badge status={status} />
				<TableView>
					<Information course={course} />
					<Schedule course={course} />
					<Description course={course} />
				</TableView>
			</Container>
		)
	}
}
