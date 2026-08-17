import * as React from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {useDispatch, useSelector} from 'react-redux'

import {useIsDevMode} from '../../source/lib/use-is-dev-mode'
import {selectEnabledCalendarSources, toggleCalendarSource} from '../../source/redux/parts/settings'
import {requestFullCalendarAccess} from './device-calendar'
import {calendarAccessOptions, deviceCalendarsOptions} from './query'
import {type CalendarSource, REMOTE_SOURCES} from './sources'

type CalendarSourcesState = {
	remote: CalendarSource[]
	device: CalendarSource[]
	all: CalendarSource[]
	enabled: CalendarSource[]
	deviceAvailable: boolean
	canOfferDevice: boolean
	toggle: (id: string) => void
	requestDevice: () => Promise<void>
}

export function useCalendarSources(): CalendarSourcesState {
	let devMode = useIsDevMode()
	let dispatch = useDispatch()
	let client = useQueryClient()
	let enabledIds = useSelector(selectEnabledCalendarSources)

	// Outside dev mode this stays disabled, so nothing here so much as asks
	// EventKit what it has already granted.
	let {data: granted = false} = useQuery({...calendarAccessOptions(), enabled: devMode})

	let {data: device = []} = useQuery({
		...deviceCalendarsOptions(),
		enabled: devMode && granted,
	})

	let requestDevice = React.useCallback(async () => {
		// A production build must never prompt for calendar access -- this can't
		// rely on callers only rendering the opt-in row in dev mode.
		if (!devMode) return

		let response = await requestFullCalendarAccess()
		if (response.granted) {
			// Written into the shared cache rather than local state: every other
			// component holding this hook has to learn about the grant too.
			client.setQueryData(calendarAccessOptions().queryKey, true)
			await client.invalidateQueries({queryKey: deviceCalendarsOptions().queryKey})
		}
	}, [devMode, client])

	let all = React.useMemo(() => [...REMOTE_SOURCES, ...device], [device])
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

	return {
		remote: REMOTE_SOURCES,
		device,
		all,
		enabled,
		deviceAvailable: devMode && granted,
		canOfferDevice: devMode,
		toggle,
		requestDevice,
	}
}

/**
 * For a screen that knows only a source id -- the detail screen arrives with
 * one in its route params -- and needs the source behind it.
 */
export function useCalendarSource(sourceId: string): CalendarSource | undefined {
	let {all} = useCalendarSources()
	return all.find((source) => source.id === sourceId)
}
