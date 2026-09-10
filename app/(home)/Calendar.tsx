import * as React from 'react'
import {useMemo} from 'react'
import {useRouter} from 'expo-router'

import {
	CalendarModePicker,
	CalendarPicker,
	type SourcedEvent,
	useCalendarSources,
	useMergedEvents,
} from '@frogpond/ccc-calendar'
import {type CalendarBodyHandle, DayView, EventList} from '@frogpond/event-list'
import {useMomentTimer} from '@frogpond/timer'

import {
	availableCategories,
	availableOrganizations,
	filterEvents,
} from '../../source/features/calendar/filter'
import {useCalendarFilterStore} from '../../source/features/calendar/store'

export default function CalendarPage(): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000})
	let {all, enabled, toggle, canOfferDevice, deviceAvailable, requestDevice} = useCalendarSources()
	let {events, failed, isLoading, isRefetching, refetchAll} = useMergedEvents(enabled)
	let bodyRef = React.useRef<CalendarBodyHandle>(null)

	let {filter, selectFilter, mode, selectMode} = useCalendarFilterStore()

	let categories = useMemo(() => availableCategories(events), [events])
	let organizations = useMemo(() => availableOrganizations(events), [events])
	let filteredEvents = useMemo(() => filterEvents(events, filter), [events, filter])

	let onPressEvent = (entry: SourcedEvent) => {
		router.push({
			pathname: '/EventDetail',
			params: {source: entry.sourceId, eventKey: entry.key},
		})
	}

	let onTodayPress = React.useCallback(() => {
		bodyRef.current?.showToday()
	}, [])

	let enabledIds = useMemo(() => enabled.map((source) => source.id), [enabled])

	let Body = mode === 'day' ? DayView.DayView : EventList.EventList

	return (
		<>
			<Body
				ref={bodyRef}
				events={filteredEvents}
				failed={failed}
				isLoading={isLoading}
				now={now}
				onPressEvent={onPressEvent}
				onRefresh={refetchAll}
				refreshing={isRefetching}
				sources={enabled}
			/>
			<CalendarModePicker mode={mode} onSelectMode={selectMode} />
			<CalendarPicker
				categories={categories}
				enabledIds={enabledIds}
				filter={filter}
				onRequestDeviceCalendars={canOfferDevice && !deviceAvailable ? requestDevice : undefined}
				onSelectFilter={selectFilter}
				onToggleSource={toggle}
				onTodayPress={onTodayPress}
				organizations={organizations}
				sources={all}
			/>
		</>
	)
}
