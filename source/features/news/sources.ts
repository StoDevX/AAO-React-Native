import type {ImageResolvedAssetSource} from 'react-native'
import * as newsImages from '../../../images/news-sources/index'

export type NewsSource = {
	id: string
	title: string
	thumbnail: false | ImageResolvedAssetSource
}

/**
 * The app's own news feeds. A menu-based picker, unlike tabs, doesn't need a
 * route per source -- but only these two are exposed today. Oleville
 * (data/sources.yaml) has no screen and isn't added here.
 */
export const NEWS_SOURCES: NewsSource[] = [
	{id: 'stolaf', title: 'St. Olaf News', thumbnail: newsImages.stolaf},
	{id: 'mess', title: 'The Olaf Messenger', thumbnail: newsImages.mess},
]
