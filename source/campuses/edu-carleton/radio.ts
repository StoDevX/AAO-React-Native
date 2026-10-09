import type {Station} from '../../features/streaming/radio/campus-section'

/**
 * The purple of the logo's "krlx". White text on it is 5.5:1, and the player's
 * fill only darkens from it downward.
 */
const KRLX_TINT = '#8a529e'

/** KRLX, Carleton's student station. */
export const KRLX: Station = {
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
}
