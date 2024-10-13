import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {
	StyleSheet,
	Text,
	Platform,
	ScrollViewProps,
	ScrollView,
	TextProps,
} from 'react-native'
import type {CourseType} from '../../../../lib/course-search'
import {SolidBadge as Badge} from '@frogpond/badge'
import moment from 'moment-timezone'
import {formatDay} from '../lib/format-day'
import {TableView, Section, Cell} from '@frogpond/tableview'
import {
	SelectableCell,
	MultiLineDetailCell,
	MultiLineLeftDetailCell,
} from '@frogpond/tableview/cells'
import * as c from '@frogpond/colors'
import {deptNum} from '../lib/format-dept-num'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import zip from 'lodash/zip'
import {RouteProp, useRoute} from 'expo-router'
import {RootStackParamList} from '../../../../navigation/types'
import {NativeStackNavigationOptions} from 'expo-router-stack'

const Container = (props: ScrollViewProps) => (
	<ScrollView {...props} style={[styles.container, props.style]} />
)

const Header = (props: TextProps) => (
	<Text {...props} style={[styles.header, props.style]} />
)
const SubHeader = (props: TextProps) => (
	<Text {...props} style={[styles.subHeader, props.style]} />
)

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
		color: c.secondaryLabel,
		textAlign: 'right',
	},
	container: {
		paddingVertical: 6,
	},
	header: {
		fontSize: 36,
		textAlign: 'center',
		marginTop: 20,
		marginHorizontal: 10,
		color: c.label,
	},
	subHeader: {
		fontSize: 21,
		textAlign: 'center',
		marginTop: 5,
	},
})

function Information({course}: {course: CourseType}) {
	return (
		<Section header="INFORMATION">
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
	let groupedByDay = groupBy(
		course.offerings,
		(courseOffering) => courseOffering.day,
	)
	let schedule = map(groupedByDay, (offerings, day) => {
		let timesFormatted = offerings.map((offering) => {
			let start = moment.tz(offering.start, 'H:mm', timezone()).format('h:mm A')
			let end = moment.tz(offering.end, 'H:mm', timezone()).format('h:mm A')
			return `${start} – ${end}`
		})
		let locations = offerings.map((offering) => offering.location)

		let timelocs = zip(timesFormatted, locations)

		let timelocsObj = timelocs.map(([time, location]) => ({time, location}))

		let rightDetail = timelocsObj.map((timeloc) => (
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

	return <Section header="SCHEDULE">{schedule}</Section>
}

function Notes({course}: {course: CourseType}) {
	if (!course.notes) {
		return null
	}

	let notesText = course.notes.join(' ')

	let notes =
		Platform.OS === 'ios' ? (
			<SelectableCell text={notesText} />
		) : (
			<Cell
				cellContentView={
					<Text selectable={true} style={styles.chunk}>
						{notesText}
					</Text>
				}
			/>
		)

	return <Section header="NOTES">{notes}</Section>
}

function Description({course}: {course: CourseType}) {
	if (!course.description) {
		return null
	}

	let descText = course.description[0]

	let description =
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

	return <Section header="DESCRIPTION">{description}</Section>
}

const BGCOLORS = {
	Open: c.moneyGreen,
	Closed: c.salmon,
} as const

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, 'CourseDetail'>
}): NativeStackNavigationOptions => {
	let {name} = props.route.params.course
	return {
		title: name,
	}
}

export const CourseDetailView = (): React.JSX.Element => {
	let route = useRoute<RouteProp<RootStackParamList, 'CourseDetail'>>()
	let {course} = route.params

	let status = course.status === 'O' ? ('Open' as const) : ('Closed' as const)

	return (
		<Container>
			<Header>{course.title || course.name}</Header>
			<SubHeader>{deptNum(course)}</SubHeader>
			<Badge accentColor={BGCOLORS[status]} status={status} />
			<TableView>
				<Information course={course} />
				<Schedule course={course} />
				<Notes course={course} />
				<Description course={course} />
			</TableView>
		</Container>
	)
}
