import * as React from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {useDispatch, useSelector} from 'react-redux'

import {useIsDevMode} from '../../source/lib/use-is-dev-mode'
import {selectEnabledCalendarSources, toggleCalendarSource} from '../../source/redux/parts/settings'
import {getFullCalendarAccess, requestFullCalendarAccess} from './device-calendar'
import {deviceCalendarsOptions} from './query'
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

/// Whether a grant already exists. Only ever *checks* -- asking is
/// `requestDevice`, called from an explicit tap, so no build prompts on its own.
function useDeviceGranted(devMode: boolean): [boolean, (granted: boolean) => void] {
	let [granted, setGranted] = React.useState(false)

	React.useEffect(() => {
		if (!devMode) {
			setGranted(false)
			return
		}
		void (async () => {
			let current = await getFullCalendarAccess()
			setGranted(current.granted)
		})()
	}, [devMode])

	return [granted, setGranted]
}

export function useCalendarSources(): CalendarSourcesState {
	let devMode = useIsDevMode()
	let dispatch = useDispatch()
	let client = useQueryClient()
	let enabledIds = useSelector(selectEnabledCalendarSources)
	let [granted, setGranted] = useDeviceGranted(devMode)

	let {data: device = []} = useQuery({
		...deviceCalendarsOptions(),
		enabled: devMode && granted,
	})

	let requestDevice = React.useCallback(async () => {
		let response = await requestFullCalendarAccess()
		if (response.granted) {
			setGranted(true)
			await client.invalidateQueries({queryKey: deviceCalendarsOptions().queryKey})
		}
	}, [client, setGranted])

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

/// For a screen that knows only a source id -- the detail screen arrives with
/// one in its route params -- and needs the source behind it.
export function useCalendarSource(sourceId: string): CalendarSource | undefined {
	let {all} = useCalendarSources()
	return all.find((source) => source.id === sourceId)
}
