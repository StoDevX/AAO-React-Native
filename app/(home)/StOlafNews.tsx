import * as React from 'react'

import {NewsScreen} from '../../source/features/news/news-screen'
import {STOLAF_NEWS} from '../../source/features/news/sources'

export default function StOlafNewsPage(): React.ReactNode {
	return <NewsScreen source={STOLAF_NEWS} />
}
