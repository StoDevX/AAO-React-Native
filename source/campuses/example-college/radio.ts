import type {Station} from '../../features/streaming/radio/campus-section'

/**
 * KMNK, Wiki Monkeys' station. Its logo names no published image yet, so the
 * player draws a blank label for it.
 */
export const KMNK: Station = {
	id: 'kmnk',
	logos: [{name: 'KMNK 91.7, The Peak', imageName: 'kmnk', tint: '#2f6b8f', labelColor: '#eef4f7'}],
	websiteUrl: 'https://kmnk.college.example/',
	scheduleCalendar: 'kmnk-schedule',
	stationName: 'KMNK 91.7, The Peak',
	stationNumber: '+15555550191',
	title: 'Norway Valley College Radio',
}
