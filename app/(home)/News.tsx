import * as React from 'react'
import {Stack} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {useDispatch, useSelector} from 'react-redux'

import {NewsList} from '../../source/features/news/news-list'
import {namedNewsOptions} from '../../source/features/news/query'
import {NEWS_SOURCES} from '../../source/features/news/sources'
import {selectNewsSource, setNewsSource} from '../../source/redux/parts/settings'

export default function NewsPage(): React.ReactNode {
	let dispatch = useDispatch()
	let selectedId = useSelector(selectNewsSource)
	let source = NEWS_SOURCES.find((candidate) => candidate.id === selectedId) ?? NEWS_SOURCES[0]

	return (
		<>
			<Stack.Screen options={{title: source.title}} />
			<NewsList
				onSelectSource={(id) => dispatch(setNewsSource(id))}
				query={useQuery(namedNewsOptions(source.id))}
				selectedSourceId={source.id}
				sources={NEWS_SOURCES}
				thumbnail={source.thumbnail}
			/>
		</>
	)
}
