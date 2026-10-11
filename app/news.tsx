import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'

import {campusById} from '../source/campuses'
import {useCampusParam} from '../source/features/campus/campus-param'
import {requiresSection} from '../source/features/campus/section-gate'
import {NewsScreen} from '../source/features/news/news-screen'

/**
 * A campus's own news site, under its own title: the campus `?campus=` names,
 * as the section gate reads it, or else the active one.
 */
function NewsPage(): React.ReactNode {
	let {campus: param} = useLocalSearchParams<{campus?: string}>()
	let news = campusById(useCampusParam(param)).news
	// requiresSection has drawn the notice for a campus without one.
	if (!news) {
		return null
	}
	return (
		<>
			<Stack.Title>{news.source.title}</Stack.Title>
			<NewsScreen source={news.source} />
		</>
	)
}

export default requiresSection(
	'news',
	{title: 'News', noun: 'a news feed', systemImage: 'megaphone'},
	NewsPage,
)
