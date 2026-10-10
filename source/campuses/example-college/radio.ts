import type {Station} from '../../features/streaming/radio/campus-section'

/**
 * KMNK, Wiki Monkeys' station. Its logos name no published image yet, so the
 * player draws a blank label for each.
 *
 * The second is the first mirrored, its blue turned to the opposite orange, so
 * the station has a logo to tap on to: a UI test scrubbing the record checks
 * the logo stays put, which a station with one logo could never show.
 */
export const KMNK: Station = {
	id: 'kmnk',
	logos: [
		{name: 'KMNK 91.7, The Peak', imageName: 'kmnk', tint: '#2f6b8f', labelColor: '#eef4f7'},
		{name: 'mirrored', imageName: 'kmnk-mirrored', tint: '#8f532f', labelColor: '#f7f1ee'},
	],
	websiteUrl: 'https://kmnk.college.example/',
	scheduleCalendar: 'kmnk-schedule',
	stationName: 'KMNK 91.7, The Peak',
	stationNumber: '+15555550191',
	title: 'Norway Valley College Radio',
}
