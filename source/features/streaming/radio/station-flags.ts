import * as React from 'react'
import {z} from 'zod'

import {
	featureSwitchesNow,
	followsFeatureSwitches,
	useFeatureSwitches,
	type FeatureSwitches,
} from '../../../lib/feature-switches'
import {useCampus} from '../../campus/store'
import {STATIONS, stationsOffered, type Station, type StationId} from './stations'

/** Each station's switch, as `data/features.yaml`'s `radio` publishes it. */
export type StationFlags = Readonly<Partial<Record<StationId, {enabled: boolean}>>>

const RadioSectionSchema = z.record(z.string(), z.object({enabled: z.boolean()}))

function isKnownStation(id: string): id is StationId {
	return Object.hasOwn(STATIONS, id)
}

/**
 * The stations' switches in the published file, leaving out stations this
 * build does not run. Undefined for a missing or malformed `radio` section,
 * which leaves every station off.
 */
export function stationFlagsFrom(switches: FeatureSwitches | undefined): StationFlags | undefined {
	let parsed = RadioSectionSchema.safeParse(switches?.radio)
	if (!parsed.success) {
		return undefined
	}
	let flags: Partial<Record<StationId, {enabled: boolean}>> = {}
	for (let [id, flag] of Object.entries(parsed.data)) {
		if (isKnownStation(id)) {
			flags[id] = flag
		}
	}
	return flags
}

/**
 * Whether `stationId` may be shown and played: only when the file says so,
 * unless this build ignores the switches.
 */
export function isStationOn(
	stationId: StationId,
	flags: StationFlags | undefined,
	ignoreFlags: boolean,
): boolean {
	return ignoreFlags || flags?.[stationId]?.enabled === true
}

/** Whether each station is on, following the published switches. */
export function useStationOn(): (stationId: StationId) => boolean {
	let switches = useFeatureSwitches()
	return React.useMemo(() => {
		let flags = stationFlagsFrom(switches)
		return (stationId: StationId) => isStationOn(stationId, flags, !followsFeatureSwitches())
	}, [switches])
}

/** Whether `stationId` is on as the switches were last fetched, for code outside React. */
export function stationOnNow(stationId: StationId): boolean {
	return isStationOn(stationId, stationFlagsFrom(featureSwitchesNow()), !followsFeatureSwitches())
}

/** The stations the player offers on the active campus, switched-off ones left out. */
export function useOfferedStations(): ReadonlyArray<Station> {
	let campus = useCampus()
	let stationOn = useStationOn()
	return React.useMemo(() => stationsOffered(campus, stationOn), [campus, stationOn])
}

/**
 * Whether each station is on as the switches were last fetched, or undefined
 * while they are unknown: launch is still restoring them, or none has loaded.
 */
export function stationSwitchesNow(): ((stationId: StationId) => boolean) | undefined {
	if (followsFeatureSwitches() && featureSwitchesNow() === undefined) {
		return undefined
	}
	return stationOnNow
}

/**
 * Whether the loaded station has to stop for being switched off. Not while
 * launch restores the saved switches: until then every station reads as off,
 * and a station a reminder started would stop for no reason.
 */
export function mustStopStation(state: {
	stationId: StationId | null
	stationOn: (stationId: StationId) => boolean
	restoring: boolean
}): boolean {
	return state.stationId !== null && !state.restoring && !state.stationOn(state.stationId)
}
