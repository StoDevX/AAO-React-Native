import * as logos from '../../../../images/streaming'
import type {RadioLogo} from './theme'

export type StationId = 'ksto' | 'krlx'

/** Everything the app knows about a radio station: its screen, and how to play it. */
export type Station = {
	id: StationId
	/** The station's logos. With more than one, tapping the logo shows the next. */
	logos: [RadioLogo, ...RadioLogo[]]
	playerUrl: string
	stationNumber: string
	title: string
	scheduleHref: '/ksto-schedule' | '/krlx-schedule'
	/** The station's listener chat, where it has one. */
	chatUrl?: string
	/** Where the song now on air is published, for a station that does. */
	nowPlayingUrl?: string
	stationName: string
	source: {
		useEmbeddedPlayer: boolean
		embeddedPlayerUrl: string
		streamSourceUrl: string
	}
}

/**
 * Each KSTO tint holds white text at 4.5:1 or better, and the player's fill
 * only darkens from it downward.
 */
const COW_TINT = '#685393'
const WORDMARK_TINT = '#5a52b0'
const DUMPSTER_TINT = '#2a7d68'
/** The narwhal's slate, lightened from the logo's #494e73. */
const NARWHAL_TINT = '#525881'
/** The sketched cow's navy ink, lightened from the logo's #17203d. */
const SKETCH_TINT = '#3d55a3'

/**
 * The purple of the logo's "krlx". White text on it is 5.5:1, and the player's
 * fill only darkens from it downward.
 */
const KRLX_TINT = '#8a529e'

export const STATIONS: Record<StationId, Station> = {
	ksto: {
		id: 'ksto',
		logos: [
			{
				name: 'cow badge',
				image: logos.ksto,
				tint: COW_TINT,
				labelColor: '#e4d7f2',
				labelScale: 0.86,
			},
			{
				name: 'wordmark',
				image: logos.kstoWordmark,
				tint: WORDMARK_TINT,
				labelColor: '#e8e0ef',
				labelScale: 1,
			},
			{
				name: 'dumpster fire',
				image: logos.kstoDumpster,
				tint: DUMPSTER_TINT,
				labelColor: '#e5d4d9',
				labelScale: 0.72,
			},
			{
				name: 'narwhal',
				image: logos.kstoNarwhal,
				tint: NARWHAL_TINT,
				labelColor: '#494e73',
				labelScale: 1,
			},
			{
				name: 'cow sketch',
				image: logos.kstoSketch,
				tint: SKETCH_TINT,
				// A sheet of cream paper, for the ink drawing.
				labelColor: '#f3ead6',
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
		logos: [
			{
				name: 'krlx 88.1',
				image: logos.krlx,
				tint: KRLX_TINT,
				labelColor: '#f6f1e4',
			},
		],
		playerUrl: 'https://live.krlx.org',
		scheduleHref: '/krlx-schedule',
		chatUrl: 'https://minnit.chat/KRLX',
		// The metaradio plugin krlx.org's own player reads; station 1 is KRLX.
		nowPlayingUrl: 'https://content.krlx.org/wp-json/metaradio/v1/stationnow/?station=1',
		source: {
			useEmbeddedPlayer: false,
			embeddedPlayerUrl: 'https://live.krlx.org',
			streamSourceUrl: 'https://s3.voscast.com:10803/stream',
		},
		stationName: '88.1 KRLX-FM',
		stationNumber: '+15072224127',
		title: 'Carleton College Radio',
	},
}
