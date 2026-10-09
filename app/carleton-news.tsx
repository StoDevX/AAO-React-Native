import * as React from 'react'

import {NewsScreen} from '../source/features/news/news-screen'
import {CARLETON_NEWS} from '../source/features/news/sources'

export default function CarletonNewsPage(): React.ReactNode {
	return <NewsScreen source={CARLETON_NEWS} />
}
