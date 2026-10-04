import type {ImageSourcePropType} from 'react-native'
import {remoteImage} from '../../lib/remote-images'

export type NewsSource = {
	id: string
	title: string
	/** Read when drawn, since the image's address depends on the server setting. */
	readonly thumbnail: false | ImageSourcePropType
}

/** The student newspaper. */
export const OLAF_MESSENGER: NewsSource = {
	id: 'mess',
	title: 'The Olaf Messenger',
	get thumbnail() {
		return remoteImage('news-sources', 'mess')
	},
}

/** The college's own news site. */
export const STOLAF_NEWS: NewsSource = {
	id: 'stolaf',
	title: 'St. Olaf News',
	get thumbnail() {
		return remoteImage('news-sources', 'stolaf')
	},
}
