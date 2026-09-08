import * as React from 'react'
import {useMemo} from 'react'
import {useRouter} from 'expo-router'

import {
	CalendarPicker,
	type SourcedEvent,
	useCalendarSources,
	useMergedEvents,
} from '@frogpond/ccc-calendar'
import {EventList} from '@frogpond/event-list'
import {useMomentTimer} from '@frogpond/timer'

import {useCalendarFilterStore} from '../../source/features/calendar/store'

export default function CalendarPage(): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000})
	let {all, enabled, toggle, canOfferDevice, deviceAvailable, requestDevice} = useCalendarSources()
	let {events, failed, isLoading, isRefetching, refetchAll} = useMergedEvents(enabled)
	let eventListRef = React.useRef<EventList.EventListHandle>(null)

	let {filter, selectFilter} = useCalendarFilterStore()

	// Z-A in code -> A-Z visually: SwiftUI Menu Section renders bottom-to-top
	let availableCategories = useMemo(() => {
		let cats = new Set(events.flatMap((e) => e.event.categories ?? []))
		return [...cats].sort((a, b) => b.localeCompare(a))
	}, [events])

	let availableOrganizations = useMemo(() => {
		let orgs = new Set(events.flatMap((e) => e.event.organization ?? []))
		return [...orgs].sort((a, b) => b.localeCompare(a))
	}, [events])

	let filteredEvents = useMemo(() => {
		if (filter === null) return events
		if (filter.axis === 'organization') {
			return events.filter((e) => e.event.organization?.includes(filter.value) ?? false)
		}
		return events.filter((e) => e.event.categories?.includes(filter.value))
	}, [events, filter])

	let onPressEvent = (entry: SourcedEvent) => {
		router.push({
			pathname: '/EventDetail',
			params: {source: entry.sourceId, eventKey: entry.key},
		})
	}

	let onTodayPress = React.useCallback(() => {
		eventListRef.current?.scrollToToday()
	}, [])

	let enabledIds = useMemo(() => enabled.map((source) => source.id), [enabled])

	return (
		<>
			<EventList.EventList
				ref={eventListRef}
				events={filteredEvents}
				failed={failed}
				isLoading={isLoading}
				now={now}
				onPressEvent={onPressEvent}
				onRefresh={refetchAll}
				refreshing={isRefetching}
				sources={enabled}
			/>
			<CalendarPicker
				categories={availableCategories}
				enabledIds={enabledIds}
				filter={filter}
				onRequestDeviceCalendars={canOfferDevice && !deviceAvailable ? requestDevice : undefined}
				onSelectFilter={selectFilter}
				onToggleSource={toggle}
				onTodayPress={onTodayPress}
				organizations={availableOrganizations}
				sources={all}
			/>
		</>
	)
}
