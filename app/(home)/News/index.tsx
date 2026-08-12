import * as React from 'react'

import * as newsImages from '../../../images/news-sources/index'
import {NewsList} from '../../../source/features/news/news-list'
import {namedNewsOptions} from '../../../source/features/news/query'
import {useQuery} from '@tanstack/react-query'

export default function StOlafNewsPage(): React.ReactNode {
	return (
		<NewsList
			query={useQuery(namedNewsOptions('stolaf'))}
			thumbnail={newsImages.stolaf}
		/>
	)
}
