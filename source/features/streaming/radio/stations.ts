import {imageUrl, remoteImage, type RemoteImage} from '../../../lib/remote-images'
import type {RadioLogo} from './theme'

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
				imageName: 'ksto',
				tint: COW_TINT,
				labelColor: '#e4d7f2',
				labelScale: 0.86,
			},
			{
				name: 'wordmark',
				imageName: 'ksto-wordmark',
				tint: WORDMARK_TINT,
				labelColor: '#e8e0ef',
				labelScale: 1,
			},
			{
				name: 'dumpster fire',
				imageName: 'ksto-dumpster',
				tint: DUMPSTER_TINT,
				labelColor: '#e5d4d9',
				labelScale: 0.72,
			},
			{
				name: 'narwhal',
				imageName: 'ksto-narwhal',
				tint: NARWHAL_TINT,
				labelColor: '#494e73',
				labelScale: 1,
			},
			{
				name: 'cow sketch',
				imageName: 'ksto-sketch',
				tint: SKETCH_TINT,
				// A sheet of cream paper, for the ink drawing.
				labelColor: '#f3ead6',
			},
		],
		websiteUrl: 'https://www.kstoradio.org/',
		scheduleHref: '/ksto-schedule',
		stationName: 'KSTO 93.1 FM',
		stationNumber: '+15077863602',
		title: 'St. Olaf College Radio',
	},
	krlx: {
		id: 'krlx',
		logos: [
			{
				name: 'krlx 88.1',
				imageName: 'krlx',
				tint: KRLX_TINT,
				labelColor: '#f6f1e4',
			},
		],
		websiteUrl: 'https://www.krlx.org/',
		scheduleHref: '/krlx-schedule',
		chatUrl: 'https://minnit.chat/KRLX',
		stationName: '88.1 KRLX-FM',
		stationNumber: '+15072224127',
		title: 'Carleton College Radio',
	},
}

/** A logo as an `<Image source>`, fetched from the server when it is drawn. */
export const logoImage = (logo: RadioLogo): RemoteImage => remoteImage('streaming', logo.imageName)

/** Every logo of every station, for fetching before the sheet opens. */
export const allStationImageUrls = (): string[] =>
	Object.values(STATIONS).flatMap((station) =>
		station.logos.map((logo) => imageUrl('streaming', logo.imageName)),
	)
