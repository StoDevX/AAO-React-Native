import type {RadioLogo} from './theme'

/** A station's id in the sources manifest, which names its streams and schedule. */
export type StationId = 'ksto' | 'krlx'

/**
 * Everything the app knows about a radio station's screen. Where its audio
 * comes from is in `data/sources.yaml`; see `useStationSources`.
 */
export type Station = {
	id: StationId
	/** The station's logos. With more than one, tapping the logo shows the next. */
	logos: [RadioLogo, ...RadioLogo[]]
	/** The station's own home page, which the ••• menu's Open Website opens. */
	websiteUrl: string
	stationNumber: string
	title: string
	scheduleHref: '/ksto-schedule' | '/krlx-schedule'
	/** The station's listener chat, where it has one. */
	chatUrl?: string
	stationName: string
}

/**
 * A campus's own radio stations. The player offers every campus's stations
 * on every campus, since anyone can listen to any of them.
 */
export type RadioSection = {
	stations: ReadonlyArray<Station>
}
