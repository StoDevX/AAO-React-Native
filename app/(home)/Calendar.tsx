import * as React from 'react'
import {useMemo} from 'react'
import {useRouter} from 'expo-router'

import {
	CalendarPicker,
	type SourcedEvent,
	useCalendarSources,
	useMergedEvents,
} from '@frogpond/ccc-calendar'
import {timezone} from '@frogpond/constants'
import {EventList} from '@frogpond/event-list'
import {useMomentTimer} from '@frogpond/timer'

import {STOLAF_POWERED_BY} from '../../source/features/calendar/constants'
import {useCalendarFilterStore} from '../../source/features/calendar/store'

export default function CalendarPage(): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let {enabled} = useCalendarSources()
	let {events, failed, isRefetching, refetchAll} = useMergedEvents(enabled)
	let eventListRef = React.useRef<EventList.EventListHandle>(null)

	let {selectedCategories, toggleCategory} = useCalendarFilterStore()

	let availableCategories = useMemo(() => {
		let cats = new Set(events.flatMap((e) => e.event.categories))
		// Reverse sort: SwiftUI Menu Section renders items bottom-to-top
		return [...cats].sort((a, b) => b.localeCompare(a))
	}, [events])

	let filteredEvents = useMemo(() => {
		if (selectedCategories.length === 0) return events
		return events.filter(
			(e) =>
				e.event.categories.length === 0 ||
				e.event.categories.some((cat) => selectedCategories.includes(cat)),
		)
	}, [events, selectedCategories])

	let onPressEvent = (entry: SourcedEvent) => {
		router.push({
			pathname: '/EventDetail',
			params: {source: entry.sourceId, eventKey: entry.key},
		})
	}

	let onTodayPress = React.useCallback(() => {
		eventListRef.current?.scrollToToday()
	}, [])

	return (
		<>
			<EventList.EventList
				ref={eventListRef}
				events={filteredEvents}
				failed={failed}
				now={now}
				onPressEvent={onPressEvent}
				onRefresh={refetchAll}
				poweredBy={STOLAF_POWERED_BY}
				refreshing={isRefetching}
				sources={enabled}
			/>
			<CalendarPicker
				categories={availableCategories}
				onTodayPress={onTodayPress}
				onToggleCategory={toggleCategory}
				selectedCategories={selectedCategories}
			/>
		</>
	)
}
