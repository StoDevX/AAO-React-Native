import type {ImageResolvedAssetSource} from 'react-native'
import * as newsImages from '../../../images/news-sources/index'

export type NewsSource = {
	id: string
	title: string
	thumbnail: false | ImageResolvedAssetSource
}

/** The student newspaper. */
export const OLAF_MESSENGER: NewsSource = {
	id: 'mess',
	title: 'The Olaf Messenger',
	thumbnail: newsImages.mess,
}

/** The college's own news site. */
export const STOLAF_NEWS: NewsSource = {
	id: 'stolaf',
	title: 'St. Olaf News',
	thumbnail: newsImages.stolaf,
}
