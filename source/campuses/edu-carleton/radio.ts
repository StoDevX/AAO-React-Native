import type {Station} from '../../features/streaming/radio/campus-section'

/**
 * The purple of the logo's "krlx". White text on it is 5.5:1, and the player's
 * fill only darkens from it downward.
 */
const KRLX_TINT = '#8a529e'
/** The heart's red, darkened from the logo's #e04954 to hold white text at 4.5:1. */
const KRLX_HEART_TINT = '#cc3b47'

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
		{
			name: 'tattoo heart',
			imageName: 'krlx-heart',
			tint: KRLX_HEART_TINT,
			labelColor: '#f6f1e4',
		},
	],
	websiteUrl: 'https://www.krlx.org/',
	schedule: 'krlx',
	chatUrl: 'https://minnit.chat/KRLX',
	stationName: '88.1 KRLX-FM',
	stationNumber: '+15072224127',
	title: 'Carleton College Radio',
}
