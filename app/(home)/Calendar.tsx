import * as React from 'react'
import {useMemo} from 'react'
import {Stack, useRouter} from 'expo-router'

import {
	CalendarPicker,
	type SourcedEvent,
	useCalendarSources,
	useMergedEvents,
} from '@frogpond/ccc-calendar'
import {timezone} from '@frogpond/constants'
import {EventList} from '@frogpond/event-list'
import {FilterToolbarButton} from '@frogpond/filter'
import type {FilterType, ListType} from '@frogpond/filter/types'
import {useMomentTimer} from '@frogpond/timer'

import {STOLAF_POWERED_BY} from '../../source/features/calendar/constants'
import {useCalendarFilterStore} from '../../source/features/calendar/store'

export default function CalendarPage(): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let {enabled} = useCalendarSources()
	let {events, failed, isRefetching, refetchAll} = useMergedEvents(enabled)
	let eventListRef = React.useRef<EventList.EventListHandle>(null)

	let {selectedCategories, setSelectedCategories} = useCalendarFilterStore()

	let availableCategories = useMemo(() => {
		let cats = new Set(events.flatMap((e) => e.event.categories))
		return [...cats].sort()
	}, [events])

	let filteredEvents = useMemo(() => {
		if (selectedCategories.length === 0) return events
		return events.filter(
			(e) =>
				e.event.categories.length === 0 ||
				e.event.categories.some((cat) => selectedCategories.includes(cat)),
		)
	}, [events, selectedCategories])

	let isFilterActive = selectedCategories.length > 0

	let categoryFilter: ListType<SourcedEvent> = {
		type: 'list',
		key: 'categories',
		enabled: isFilterActive,
		spec: {
			title: 'Categories',
			options: availableCategories.map((cat) => ({title: cat, label: cat})),
			selected: selectedCategories.map((cat) => ({title: cat, label: cat})),
			mode: 'OR',
			displayTitle: true,
			presentation: 'sheet',
		},
		apply: {key: 'event'},
	}

	let handleFilterChange = (filter: FilterType<SourcedEvent>) => {
		if (filter.type === 'list') {
			setSelectedCategories(filter.spec.selected.map((opt) => opt.title))
		}
	}

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
			<Stack.Toolbar placement="right">
				<FilterToolbarButton
					filter={categoryFilter}
					isActive={isFilterActive}
					onChange={handleFilterChange}
					title="Categories"
				/>
			</Stack.Toolbar>

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
			<CalendarPicker onTodayPress={onTodayPress} />
		</>
	)
}
