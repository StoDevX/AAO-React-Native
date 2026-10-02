import * as logos from '../../../../images/streaming'
import {tintedTheme, type RadioLogo} from './theme'

export type StationId = 'ksto' | 'krlx'

/** Everything the app knows about a radio station: its screen, and how to play it. */
export type Station = {
	id: StationId
	/** The station's screen, which the mini-player opens. */
	href: '/streaming-media/ksto' | '/streaming-media/krlx'
	/** The station's logos. With more than one, tapping the logo shows the next. */
	logos: [RadioLogo, ...RadioLogo[]]
	playerUrl: string
	stationNumber: string
	title: string
	scheduleHref: '/ksto-schedule' | '/krlx-schedule'
	stationName: string
	source: {
		useEmbeddedPlayer: boolean
		embeddedPlayerUrl: string
		streamSourceUrl: string
	}
}

/**
 * Each KSTO tint passes the same checks: white button text on it is at least
 * 4.5:1, and it is at least 3:1 against both the light background, enough for
 * the 28pt title, and Dark Mode's black, so the buttons stand out there too.
 */
const COW_TINT = '#685393'
const WORDMARK_TINT = '#5a52b0'
const DUMPSTER_TINT = '#2a7d68'
/** The narwhal's slate, #494e73, lightened just enough to clear 3:1 against black. */
const NARWHAL_TINT = '#525881'

/**
 * The purple of the logo's "krlx". White text on it is 5.5:1, and it is 3.8:1
 * against Dark Mode's black, so the buttons stand out in both modes.
 */
const KRLX_TINT = '#8a529e'

export const STATIONS: Record<StationId, Station> = {
	ksto: {
		id: 'ksto',
		href: '/streaming-media/ksto',
		logos: [
			{
				name: 'cow badge',
				image: logos.ksto,
				theme: tintedTheme(COW_TINT),
				labelColor: '#e4d7f2',
				labelScale: 0.86,
			},
			{
				name: 'wordmark',
				image: logos.kstoWordmark,
				theme: tintedTheme(WORDMARK_TINT),
				labelColor: '#e8e0ef',
				labelScale: 1,
			},
			{
				name: 'dumpster fire',
				image: logos.kstoDumpster,
				theme: tintedTheme(DUMPSTER_TINT),
				labelColor: '#e5d4d9',
				labelScale: 0.72,
			},
			{
				name: 'narwhal',
				image: logos.kstoNarwhal,
				theme: tintedTheme(NARWHAL_TINT),
				labelColor: '#494e73',
				labelScale: 1,
			},
		],
		playerUrl: 'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
		scheduleHref: '/ksto-schedule',
		// KSTO counts its listeners through its own web player, so the app plays
		// that page rather than the stream behind it.
		source: {
			useEmbeddedPlayer: true,
			embeddedPlayerUrl: 'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
			streamSourceUrl: '',
		},
		stationName: 'KSTO 93.1 FM',
		stationNumber: '+15077863602',
		title: 'St. Olaf College Radio',
	},
	krlx: {
		id: 'krlx',
		href: '/streaming-media/krlx',
		logos: [
			{
				name: 'krlx 88.1',
				image: logos.krlx,
				theme: tintedTheme(KRLX_TINT),
				labelColor: '#f6f1e4',
			},
		],
		playerUrl: 'https://live.krlx.org',
		scheduleHref: '/krlx-schedule',
		source: {
			useEmbeddedPlayer: false,
			embeddedPlayerUrl: 'https://live.krlx.org',
			streamSourceUrl: 'http://stream.krlx.org:8000/_a',
		},
		stationName: '88.1 KRLX-FM',
		stationNumber: '+15072224127',
		title: 'Carleton College Radio',
	},
}
