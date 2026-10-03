import * as logos from '../../../../images/streaming'
import type {RadioLogo} from './theme'

export type StationId = 'ksto' | 'krlx'

/** Everything the app knows about a radio station: its screen, and how to play it. */
export type Station = {
	id: StationId
	/** The station's logos. With more than one, tapping the logo shows the next. */
	logos: [RadioLogo, ...RadioLogo[]]
	playerUrl: string
	/** The station's own home page, which the ••• menu's Open Website opens. */
	websiteUrl: string
	stationNumber: string
	title: string
	scheduleHref: '/ksto-schedule' | '/krlx-schedule'
	/** The station's listener chat, where it has one. */
	chatUrl?: string
	/** Where the song now on air is published, for a station that does. */
	nowPlayingUrl?: string
	stationName: string
	source: {
		/**
		 * The station's own player page, for a station whose owner wants it loaded
		 * so that its analytics keep counting listens. The app loads it with its
		 * sound off, beside the stream it plays itself. A station that sets this
		 * must keep it set: dropping the page drops the owner's count, which
		 * they asked us to keep. See `MutedStationPage` and `RadioHost`.
		 */
		embeddedPlayerUrl?: string
		/** The stream the app plays itself, so that Control Center and AirPlay see it. */
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
		websiteUrl: 'https://www.kstoradio.org/',
		scheduleHref: '/ksto-schedule',
		// DECISION (St. Olaf / KSTO): KSTO counts its listeners through the analytics
		// in its own web player, and asked that the app keep loading that page. So
		// the app loads the page, muted, AND plays the stream the page plays, itself.
		// Keep both: without the page KSTO's count drops, and without our own stream
		// there is no Control Center, lock screen or AirPlay. Two copies of the stream
		// play at once; that is accepted.
		//
		// `streamSourceUrl` is the HLS URL that page passes to its player (read from
		// its source, 2026-10-03). If KSTO changes the page, or the stream stops,
		// read the page again and update it. The page's commented-out
		// `.../radio/ksto1.stream/master.m3u8` answers 403; do not use it.
		source: {
			embeddedPlayerUrl: 'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
			streamSourceUrl: 'https://cdn.stobcm.com/ksto/live.m3u8',
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
		websiteUrl: 'https://www.krlx.org/',
		scheduleHref: '/krlx-schedule',
		chatUrl: 'https://minnit.chat/KRLX',
		// The metaradio plugin krlx.org's own player reads; station 1 is KRLX.
		nowPlayingUrl: 'https://content.krlx.org/wp-json/metaradio/v1/stationnow/?station=1',
		source: {
			streamSourceUrl: 'https://s3.voscast.com:10803/stream',
		},
		stationName: '88.1 KRLX-FM',
		stationNumber: '+15072224127',
		title: 'Carleton College Radio',
	},
}
