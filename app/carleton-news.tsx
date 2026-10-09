import * as React from 'react'

import {carleton} from '../source/campuses/edu-carleton'
import {NewsScreen} from '../source/features/news/news-screen'

/** Carleton's news, reachable by this route on every campus. */
export default function CarletonNewsPage(): React.ReactNode {
	return <NewsScreen source={carleton.news.source} />
}
