import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {StyleSheet} from 'react-native'
import {Host, LabeledContent, List, RNHostView, Section, Text, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle, listStyle, multilineTextAlignment} from '@expo/ui/swift-ui/modifiers'
import type {CourseType, TermType} from '../../source/lib/course-search'
import {SolidBadge as Badge} from '@frogpond/badge'
import {formatDay} from '../../source/features/sis/course-search/lib/format-day'
import {
	courseSchedule,
	type ScheduleSlot,
} from '../../source/features/sis/course-search/lib/course-schedule'
import {DetailRow, SelectableText} from '../../source/components/rows'
import * as c from '@frogpond/colors'
import {deptNum} from '../../source/features/sis/course-search/lib/format-dept-num'
import {formatCourseNotes} from '../../source/features/sis/course-search/lib/format-course-notes'

import {courseByIdOptions, termByNumberOptions} from '../../source/features/sis/course-search/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

const PENDING_TERM: TermType = {hash: '', path: '', term: 0, type: '', year: 0}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

function Information({course}: {course: CourseType}) {
	return (
		<Section title="INFORMATION">
			{course.instructors ? (
				<DetailRow
					label={course.instructors.length === 1 ? 'Instructor' : 'Instructors'}
					value={course.instructors.join(', ')}
				/>
			) : null}
			<DetailRow label="Type" value={course.type} />
			{course.gereqs ? <DetailRow label="GEs" value={course.gereqs.join(', ')} /> : null}
			{course.pn ? <DetailRow label="Pass/Fail" value="Yes" /> : null}
			<DetailRow label="Prerequisites" value={course.prerequisites || 'None'} />
			{course.credits ? <DetailRow label="Credits" value={String(course.credits)} /> : null}
		</Section>
	)
}

function Schedule({course}: {course: CourseType}) {
	let schedule = courseSchedule(course.offerings)

	if (!schedule.length) {
		return null
	}

	return (
		<Section title="SCHEDULE">
			{schedule.map(({day, slots}) => (
				<LabeledDay key={day} day={day} slots={slots} />
			))}
		</Section>
	)
}

/**
 * A day and everything the course does on it. Two meetings on one day stack
 * under a single heading rather than repeating it.
 */
function LabeledDay({day, slots}: {day: string; slots: ScheduleSlot[]}) {
	return (
		<LabeledContent label={formatDay(day)}>
			<VStack alignment="trailing" spacing={2}>
				{slots.map((slot) => (
					<Text key={slot.time} modifiers={SLOT_MODIFIERS}>
						{slot.time} ({slot.location})
					</Text>
				))}
			</VStack>
		</LabeledContent>
	)
}

const SLOT_MODIFIERS = [
	font({textStyle: 'footnote'}),
	foregroundStyle(c.secondaryLabel),
	multilineTextAlignment('trailing'),
]

function Notes({course}: {course: CourseType}) {
	if (!course.notes) {
		return null
	}

	return (
		<Section title="NOTES">
			<SelectableText text={formatCourseNotes(course.notes)} />
		</Section>
	)
}

function Description({course}: {course: CourseType}) {
	if (!course.description) {
		return null
	}

	return (
		<Section title="DESCRIPTION">
			<SelectableText text={course.description[0] ?? ''} />
		</Section>
	)
}

const BGCOLORS = {
	Open: c.moneyGreen,
	Closed: c.salmon,
} as const

type Props = {
	course: CourseType
}

function CourseDetailView({course}: Props): React.ReactNode {
	let status = course.status === 'O' ? ('Open' as const) : ('Closed' as const)

	return (
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				<Section>
					<Text modifiers={TITLE_MODIFIERS}>{course.title || course.name}</Text>
					<Text modifiers={SUBTITLE_MODIFIERS}>{deptNum(course)}</Text>
					{/* The badge is a React Native component, so SwiftUI hosts it. */}
					<RNHostView matchContents={true}>
						<Badge accentColor={BGCOLORS[status]} status={status} />
					</RNHostView>
				</Section>

				<Information course={course} />
				<Schedule course={course} />
				<Notes course={course} />
				<Description course={course} />
			</List>
		</Host>
	)
}

const TITLE_MODIFIERS = [
	font({textStyle: 'title2', weight: 'semibold'}),
	foregroundStyle(c.label),
	multilineTextAlignment('center'),
]

const SUBTITLE_MODIFIERS = [
	font({textStyle: 'title3'}),
	foregroundStyle(c.secondaryLabel),
	multilineTextAlignment('center'),
]

export default function CourseDetailPage(): React.ReactNode {
	let {clbid, term} = useLocalSearchParams<{clbid: string; term: string}>()

	let {data: resolvedTerm, isLoading: termLoading} = useQuery(termByNumberOptions(Number(term)))

	let {
		data: course,
		isLoading: courseLoading,
		error,
		refetch,
	} = useQuery({
		...courseByIdOptions(resolvedTerm ?? PENDING_TERM, Number(clbid)),
		enabled: Boolean(resolvedTerm),
	})

	// The route param is a course id, meaningless to a user, so the title
	// stays empty until the course loads rather than falling back to it.
	// The name is the screen, so it takes a large title -- and the card that
	// used to repeat it below the bar is gone. Safe to collapse here: the list
	// is the only scrollable, so there is nothing above it to collapse against
	// instead. See the note in Directory/index.tsx.
	let screenTitle = (
		<>
			<Stack.Screen options={{headerLargeTitleEnabled: true}} />
			<Stack.Title>{course?.name ?? ''}</Stack.Title>
		</>
	)

	if (termLoading || courseLoading) {
		return (
			<>
				{screenTitle}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screenTitle}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!course) {
		return (
			<>
				{screenTitle}
				<NoticeView text="Could not find this course." />
			</>
		)
	}

	return (
		<>
			{screenTitle}
			<CourseDetailView course={course} />
		</>
	)
}
