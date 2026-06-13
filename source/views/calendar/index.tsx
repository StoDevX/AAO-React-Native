import * as React from 'react'
import {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {useQuery} from '@tanstack/react-query'

import {
	SegmentedSwitcher,
	SwitcherSegment,
} from '../../components/segmented-switcher'

function StOlafCalendarView() {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the St. Olaf calendar',
				href: 'https://wp.stolaf.edu/calendar/',
			}}
			query={useQuery(namedCalendarOptions('stolaf'))}
		/>
	)
}

function NorthfieldCalendarView() {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by VisitingNorthfield.com',
				href: 'https://visitingnorthfield.com/events/calendar/',
			}}
			query={useQuery(namedCalendarOptions('northfield'))}
		/>
	)
}

type CalendarSource = 'stolaf' | 'northfield'

const SEGMENTS: ReadonlyArray<SwitcherSegment<CalendarSource>> = [
	{value: 'stolaf', label: 'St. Olaf'},
	{value: 'northfield', label: 'Northfield'},
]

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	calendar: {
		flex: 1,
	},
})

function CalendarView(): React.ReactNode {
	let [source, setSource] = useState<CalendarSource>('stolaf')

	return (
		<View style={styles.container}>
			<SegmentedSwitcher
				onChange={setSource}
				segments={SEGMENTS}
				value={source}
			/>
			<View style={styles.calendar}>
				{source === 'stolaf' ? (
					<StOlafCalendarView />
				) : (
					<NorthfieldCalendarView />
				)}
			</View>
		</View>
	)
}

export {CalendarView as View}

export type NavigationParams = undefined
export const NavigationKey = 'Calendar'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Calendar',
}
