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

import {dayWindow, useFacets, useOccurrences} from '../../source/database/calendar/read'
import {useCalendarFilterStore} from '../../source/features/calendar/store'

export default function CalendarPage(): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000})
	let {all, enabled, toggle, canOfferDevice, deviceAvailable, requestDevice} = useCalendarSources()
	let {failed, isLoading, isRefetching, refetchAll} = useMergedEvents(enabled)
	let bodyRef = React.useRef<CalendarBodyHandle>(null)

	let {filter, selectFilter, mode, selectMode} = useCalendarFilterStore()

	let enabledIds = useMemo(() => enabled.map((source) => source.id), [enabled])

	// `dayWindow` floors to the day, so this recomputes every minute but keeps
	// returning a window equal by value -- the read hooks below key their
	// queries on that value, never on this object's own identity, so an equal
	// window does not mint a new query key.
	let window = useMemo(() => dayWindow(now.toDate()), [now])
	let {events} = useOccurrences({window, sourceIds: enabledIds, filters: filter ? [filter] : []})
	let categories = useFacets({axis: 'category', window, sourceIds: enabledIds})
	let organizations = useFacets({axis: 'organization', window, sourceIds: enabledIds})

	let onPressEvent = (entry: SourcedEvent) => {
		router.push({
			pathname: '/EventDetail',
			params: {source: entry.sourceId, eventKey: entry.key},
		})
	}

	let onTodayPress = React.useCallback(() => {
		bodyRef.current?.showToday()
	}, [])

	let Body = mode === 'day' ? DayView.DayView : EventList.EventList

	return (
		<>
			<Body
				ref={bodyRef}
				events={events}
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
