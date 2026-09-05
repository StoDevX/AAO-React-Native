import * as React from 'react'
import {StyleSheet, type ImageResolvedAssetSource} from 'react-native'
import {ContentUnavailableView, Host, List, VStack} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import type {StoryType} from './types'
import {NewsRow} from './news-row'
import {cleanEntries, trimStoryCateogry} from './lib/util'
import {emptyStateProps} from './lib/empty-state'
import {UseQueryResult} from '@tanstack/react-query'

type Props = {
	query: UseQueryResult<StoryType[]>
	thumbnail: false | ImageResolvedAssetSource
	selectedCategory: string | null
}

let getStoryCategories = (story: StoryType) => {
	return (story.categories ?? []).map((category) => trimStoryCateogry(category))
}

export const NewsList = (props: Props): React.ReactNode => {
	let {data = [], error, refetch, isError, isLoading} = props.query

	let entries = React.useMemo(() => cleanEntries(data), [data])

	let filteredEntries = React.useMemo(() => {
		if (props.selectedCategory === null) return entries
		return entries.filter((story) =>
			getStoryCategories(story).includes(props.selectedCategory as string),
		)
	}, [entries, props.selectedCategory])

	let hasActiveFilter = props.selectedCategory !== null

	if (isLoading) {
		return <LoadingView />
	}

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	return (
		<Host style={styles.host}>
			<VStack spacing={0}>
				<List
					modifiers={[
						listStyle('plain'),
						refreshable(async () => {
							await refetch()
						}),
					]}
				>
					{filteredEntries.length === 0 ? (
						<ContentUnavailableView systemImage="newspaper" {...emptyStateProps(hasActiveFilter)} />
					) : (
						filteredEntries.map((story, index) => (
							<NewsRow
								key={story.title}
								isLast={index === filteredEntries.length - 1}
								onPress={(url: string) => openUrl(url)}
								story={story}
								thumbnail={props.thumbnail}
							/>
						))
					)}
				</List>
			</VStack>
		</Host>
	)
}

/** Extract unique categories from stories, sorted A-Z */
export function extractCategories(stories: StoryType[]): string[] {
	let cleaned = cleanEntries(stories)
	let cats = new Set(cleaned.flatMap((story) => getStoryCategories(story)))
	return [...cats].sort()
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
})
