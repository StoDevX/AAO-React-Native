import * as React from 'react'

import {stolaf} from '../source/campuses/edu-stolaf'
import {NewsScreen} from '../source/features/news/news-screen'

/** St. Olaf's news, reachable by this route on every campus. */
export default function StOlafNewsPage(): React.ReactNode {
	return <NewsScreen source={stolaf.news.source} />
}
