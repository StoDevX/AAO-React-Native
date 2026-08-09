import * as React from 'react'

import * as newsImages from '../../../images/news-sources/index'
import {NewsList} from './news-list'
import {namedNewsOptions} from './query'
import {useQuery} from '@tanstack/react-query'

export const StOlafNewsView = (): React.ReactNode => (
	<NewsList
		query={useQuery(namedNewsOptions('stolaf'))}
		thumbnail={newsImages.stolaf}
	/>
)

export const MessNewsView = (): React.ReactNode => (
	<NewsList
		query={useQuery(namedNewsOptions('mess'))}
		thumbnail={newsImages.mess}
	/>
)
