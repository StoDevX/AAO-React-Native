import * as React from 'react'
import {useDispatch, useSelector} from 'react-redux'

import {selectEnabledCalendarSources, toggleCalendarSource} from '../../source/redux/parts/settings'
import {useLegacyCampus} from '../../source/features/campus/store'
import {type CalendarSource, REMOTE_SOURCES, remoteSourcesFor} from './sources'

type CalendarSourcesState = {
	all: CalendarSource[]
	enabled: CalendarSource[]
	toggle: (id: string) => void
}

export function useCalendarSources(): CalendarSourcesState {
	let dispatch = useDispatch()
	let enabledIds = useSelector(selectEnabledCalendarSources)
	// The campus's own calendars: switching campus swaps the list, while each
	// calendar keeps the on or off the reader last gave it.
	let campus = useLegacyCampus()
	let all = React.useMemo(() => remoteSourcesFor(campus), [campus])

	// Filter to only IDs that exist in `all` -- persisted state can reference
	// sources that no longer exist (e.g., 'uitest' from a UI test run, or a
	// device calendar enabled before those were dropped), and the other
	// campus's calendars.
	let enabled = React.useMemo(
		() => all.filter((source) => enabledIds.includes(source.id)),
		[all, enabledIds],
	)

	let toggle = React.useCallback(
		(id: string) => {
			dispatch(toggleCalendarSource(id))
		},
		[dispatch],
	)

	return {all, enabled, toggle}
}

/**
 * For a screen that knows only a source id -- the detail screen arrives with
 * one in its route params -- and needs the source behind it, on either campus.
 */
export function useCalendarSource(sourceId: string): CalendarSource | undefined {
	return REMOTE_SOURCES.find((source) => source.id === sourceId)
}
