import type {Station} from '../../features/streaming/radio/campus-section'

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

/** KSTO, St. Olaf's student station. */
export const KSTO: Station = {
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
	scheduleCalendar: 'ksto-schedule',
	stationName: 'KSTO 93.1 FM',
	stationNumber: '+15077863602',
	title: 'St. Olaf College Radio',
}
