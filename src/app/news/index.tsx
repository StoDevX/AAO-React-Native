import React from 'react'
import {NewsList} from '../../views/news/news-list'
import {useNamedNewsSource} from '../../views/news/query'
import * as newsImages from '../../../images/news-sources/index'

export default function StOlafNewsTab(): React.ReactNode {
	return (
		<NewsList
			query={useNamedNewsSource('stolaf')}
			thumbnail={newsImages.stolaf}
		/>
	)
}
