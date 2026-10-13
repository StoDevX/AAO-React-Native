import * as React from 'react'
import {useMemo} from 'react'
import {useRouter} from 'expo-router'

import {
	CalendarModePicker,
	CalendarPicker,
	type SourcedEvent,
	useMergedEvents,
} from '@frogpond/ccc-calendar'
import {type CalendarBodyHandle, DayView, EventList} from '@frogpond/event-list'
import {useMomentTimer} from '@frogpond/timer'

import {dayWindow, useFacets, useOccurrences} from '../../database/calendar/read'
import {calendarView} from './scope'
import {useCalendarFilterStore} from './store'
import {useCampusCalendarSources} from './use-campus-calendar'

type Props = {
	/**
	 * An organization to show the events of, as the Student Orgs screen opens
	 * the calendar for one. Absent for the calendar itself.
	 */
	organization?: string
}

/** The calendar, whole or narrowed to one organization -- see `calendarView`. */
export function CalendarScreen({organization}: Props): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000})
	let {all, enabled, toggle} = useCampusCalendarSources()
	let bodyRef = React.useRef<CalendarBodyHandle>(null)

	let saved = useCalendarFilterStore()
	let {filter, mode, adjustable, sourceIds, exclude} = calendarView(saved, organization)

	// An organization's view reads its own calendars, never the reader's choice.
	let sources = useMemo(
		() => (sourceIds ? all.filter((source) => sourceIds.includes(source.id)) : enabled),
		// `sourceIds` follows from `organization` alone, a fresh array each render.
		// oxlint-disable-next-line react-hooks/exhaustive-deps
		[all, enabled, organization],
	)
	let {failed, isLoading, isRefetching, refetchAll} = useMergedEvents(sources)
	let enabledIds = useMemo(() => sources.map((source) => source.id), [sources])

	// `dayWindow` floors to the day, so this recomputes every minute but keeps
	// returning a window equal by value -- the read hooks below key their
	// queries on that value, never on this object's own identity, so an equal
	// window does not mint a new query key.
	let readWindow = useMemo(() => dayWindow(now.toDate()), [now])
	let {
		events,
		isPending: readPending,
		failed: readFailed,
	} = useOccurrences({
		window: readWindow,
		sourceIds: enabledIds,
		filters: filter ? [filter] : [],
		exclude,
	})
	// The filter menus' choices, which only the reader's own calendar offers.
	let categories = useFacets({
		axis: 'category',
		window: readWindow,
		sourceIds: enabledIds,
		exclude,
		enabled: adjustable,
	})
	let organizations = useFacets({
		axis: 'organization',
		window: readWindow,
		sourceIds: enabledIds,
		exclude,
		enabled: adjustable,
	})

	// A database read that failed leaves every enabled calendar unreadable, so
	// the body names them the way it names a fetch that failed -- and offers the
	// same Try Again, which refetches, rewrites the window and re-runs the read.
	// `useMergedEvents` cannot see this: as far as the network is concerned
	// nothing went wrong. What actually went wrong goes to Sentry from
	// `read.ts`; there is nothing on this screen a reader could do with it.
	let unreadable = readFailed ? sources : failed

	// A read still going -- the first one, or a retry of one that failed, when
	// React Query holds neither events nor an error -- is loading, not an empty
	// calendar.
	let loading = isLoading || readPending

	let onPressEvent = (entry: SourcedEvent) => {
		router.navigate({
			pathname: '/calendar/event',
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
				failed={unreadable}
				isLoading={loading}
				now={now}
				onPressEvent={onPressEvent}
				onRefresh={refetchAll}
				refreshing={isRefetching}
				sources={sources}
			/>
			{/* An organization's view has nothing for the reader to choose: its
			    filter, mode and calendars are all its own. */}
			{adjustable ? (
				<>
					<CalendarModePicker mode={mode} onSelectMode={saved.selectMode} />
					<CalendarPicker
						categories={categories}
						enabledIds={enabledIds}
						filter={filter}
						onSelectFilter={saved.selectFilter}
						onToggleSource={toggle}
						onTodayPress={mode === 'day' ? onTodayPress : undefined}
						organizations={organizations}
						sources={all}
					/>
				</>
			) : null}
		</>
	)
}
