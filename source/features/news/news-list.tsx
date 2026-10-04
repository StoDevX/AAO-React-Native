import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, VStack} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {LoadErrorView, LoadingView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import type {RemoteImage} from '../../lib/remote-images'
import type {StoryType} from './types'
import {NewsRow} from './news-row'
import {filterByCategory} from './lib/util'
import {emptyStateProps} from './lib/empty-state'
import type {NewsFeedQuery} from './lib/feed'

type Props = {
	query: NewsFeedQuery
	/** The selected source's stories, cleaned by the same pass that built the picker's categories */
	entries: StoryType[]
	thumbnail: false | RemoteImage
	selectedCategory: string | null
	/** Opens a story in the app. Without it, a story opens its link in the browser. */
	onPressStory?: (story: StoryType) => void
}

export const NewsList = (props: Props): React.ReactNode => {
	let {error, refetch, isError, isLoading} = props.query
	let {entries, selectedCategory} = props

	let filteredEntries = React.useMemo(
		() => filterByCategory(entries, selectedCategory),
		[entries, selectedCategory],
	)

	let hasActiveFilter = selectedCategory !== null

	if (isLoading) {
		return <LoadingView />
	}

	if (isError) {
		return <LoadErrorView error={error} onRetry={refetch} />
	}

	return (
		<Host style={styles.host}>
			<VStack spacing={0}>
				<List
					modifiers={[
						listStyle('insetGrouped'),
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
								// A title can repeat, as a weekly column's does; a story's link is its own.
								key={story.link ?? story.title}
								destination={props.onPressStory ? 'push' : 'external'}
								isLast={index === filteredEntries.length - 1}
								onPress={() =>
									props.onPressStory ? props.onPressStory(story) : story.link && openUrl(story.link)
								}
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

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
