import {useQuery} from '@tanstack/react-query'
import {fetchSourceBody} from '@frogpond/data-sources'

import {
	parseStationNow,
	presentNowPlaying,
	type NowPlayingPresentation,
	type StationNow,
} from './now-playing'
import {useSelectedLogo} from './player-view/use-logo-cycle'
import {useNowPlayingSource, type SourceAddress} from './sources'
import type {Station} from './stations'
import {useRadioStore} from './store'

/** The station-now feed at `source`, on the server it names when that server proxies the feed. */
async function fetchStationNow(source: SourceAddress, signal: AbortSignal): Promise<StationNow> {
	return parseStationNow(
		await fetchSourceBody(source.href, signal, 'now playing', 'json', source.campus),
	)
}

/**
 * What to show for `station`: the song on air while the station is playing,
 * asked for when the feed says the song ends; otherwise `show`, the show on air
 * if the caller has one, or the station. Only a station that publishes its
 * songs, and is loaded and playing, is asked.
 */
export function useNowPlaying(
	station: Station,
	show: {title: string} | null = null,
): NowPlayingPresentation {
	let logo = useSelectedLogo(station)
	let playing = useRadioStore(
		(state) =>
			state.stationId === station.id &&
			(state.playState === 'playing' || state.playState === 'starting'),
	)
	let source = useNowPlayingSource(station.id)
	let query = useQuery({
		queryKey: ['radio-now-playing', station.id, source],
		queryFn: ({signal}) =>
			source === undefined
				? Promise.reject(new Error(`${station.id} publishes no song feed`))
				: fetchStationNow(source, signal),
		enabled: playing && source !== undefined,
		refetchInterval: (current) => current.state.data?.refreshMs ?? 60_000,
		// A song that was on air before a relaunch says nothing now.
		meta: {persist: false},
	})
	return presentNowPlaying(playing ? (query.data?.song ?? null) : null, station, logo, show)
}
