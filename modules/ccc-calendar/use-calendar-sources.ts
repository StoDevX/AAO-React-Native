import * as React from 'react'
import {useDispatch, useSelector} from 'react-redux'

import {selectEnabledCalendarSources, toggleCalendarSource} from '../../source/redux/parts/settings'
import {type CalendarSource, REMOTE_SOURCES} from './sources'

type CalendarSourcesState = {
	all: CalendarSource[]
	enabled: CalendarSource[]
	toggle: (id: string) => void
}

export function useCalendarSources(): CalendarSourcesState {
	let dispatch = useDispatch()
	let enabledIds = useSelector(selectEnabledCalendarSources)

	// Filter to only IDs that exist in `all` -- persisted state can reference
	// sources that no longer exist (e.g., 'uitest' from a UI test run, or a
	// device calendar enabled before those were dropped).
	let enabled = React.useMemo(
		() => REMOTE_SOURCES.filter((source) => enabledIds.includes(source.id)),
		[enabledIds],
	)

	let toggle = React.useCallback(
		(id: string) => {
			dispatch(toggleCalendarSource(id))
		},
		[dispatch],
	)

	return {all: REMOTE_SOURCES, enabled, toggle}
}

/**
 * For a screen that knows only a source id -- the detail screen arrives with
 * one in its route params -- and needs the source behind it.
 */
export function useCalendarSource(sourceId: string): CalendarSource | undefined {
	return REMOTE_SOURCES.find((source) => source.id === sourceId)
}
