import {useQuery} from '@tanstack/react-query'
import {fetchSourceBody} from '@frogpond/data-sources'

import {
	parseStationNow,
	presentNowPlaying,
	type NowPlayingPresentation,
	type StationNow,
} from './now-playing'
import {useSelectedLogo} from './player-view/use-logo-cycle'
import {useNowPlayingHref} from './sources'
import type {Station} from './stations'
import {useRadioStore} from './store'

/** The station-now feed at `href`, relative to ccc-server when it proxies the feed. */
async function fetchStationNow(href: string, signal: AbortSignal): Promise<StationNow> {
	return parseStationNow(await fetchSourceBody(href, signal, 'now playing'))
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
	let url = useNowPlayingHref(station.id)
	let query = useQuery({
		queryKey: ['radio-now-playing', station.id, url],
		queryFn: ({signal}) => fetchStationNow(url ?? '', signal),
		enabled: playing && url !== undefined,
		refetchInterval: (current) => current.state.data?.refreshMs ?? 60_000,
		// A song that was on air before a relaunch says nothing now.
		meta: {persist: false},
	})
	return presentNowPlaying(playing ? (query.data?.song ?? null) : null, station, logo, show)
}
