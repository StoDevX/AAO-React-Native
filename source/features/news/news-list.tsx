import * as React from 'react'
import {StyleSheet, type ImageResolvedAssetSource} from 'react-native'
import {Stack} from 'expo-router'
import {ContentUnavailableView, Host, List, ProgressView, VStack} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import type {StoryType} from './types'
import type {NewsSource} from './sources'
import {NewsRow} from './news-row'
import {cleanEntries, trimStoryCateogry} from './lib/util'
import {emptyStateProps} from './lib/empty-state'
import {ListType, selectedOptions} from '@frogpond/filter'
import {UseQueryResult} from '@tanstack/react-query'

type Props = {
	query: UseQueryResult<StoryType[]>
	thumbnail: false | ImageResolvedAssetSource
	sources: NewsSource[]
	selectedSourceId: string
	onSelectSource: (id: string) => void
}

let getStoryCategories = (story: StoryType) => {
	return story.categories.map((category) => trimStoryCateogry(category))
}

let filterStories = (entries: StoryType[], filters: ListType<StoryType>[]) => {
	return entries.filter((story) => {
		let enabledCategories = filters.flatMap((f: ListType<StoryType>) =>
			f.spec.selected.flatMap((s) => s.title),
		)

		if (enabledCategories.length === 0) {
			return true
		}

		return getStoryCategories(story).some((category) => enabledCategories.includes(category))
	})
}

export const NewsList = (props: Props): React.ReactNode => {
	let {data = [], error, refetch, isError, isLoading} = props.query

	let entries = React.useMemo(() => cleanEntries(data), [data])

	// Only the narrowing the user asked for is state; the categories on offer
	// come from the feed. Keeping the whole filter in state instead would tie
	// the reader's choice to the story list, so a refetch that brought new
	// stories would carry an everything-selected filter in with them.
	//
	// Keyed per source rather than one shared value: NewsList is now one
	// persistent instance across every source, where the old NativeTabs
	// screens were mounted once each and never lost a tab's filter when the
	// reader switched away from it. A shared value would silently carry one
	// source's chosen titles onto another whenever they happened to share a
	// category name.
	let [chosenCategoriesBySource, setChosenCategoriesBySource] = React.useState<
		Record<string, string[] | null>
	>({})

	let chosenCategories = chosenCategoriesBySource[props.selectedSourceId] ?? null

	let setChosenCategories = (categories: string[] | null) => {
		setChosenCategoriesBySource((current) => ({...current, [props.selectedSourceId]: categories}))
	}

	let filters = React.useMemo((): ListType<StoryType>[] => {
		let allCategories = entries.flatMap((story) => getStoryCategories(story))

		if (allCategories.length === 0) {
			return []
		}

		let options = [...new Set(allCategories)].sort().map((category) => ({title: category}))
		let selected = selectedOptions(options, chosenCategories)

		return [
			{
				type: 'list',
				key: 'category',
				// Selecting nothing is the resting state and shows everything --
				// the invariant modules/filter/lib/select-options.ts applies on
				// every subsequent edit.
				enabled: selected.length > 0,
				spec: {
					title: 'Categories',
					options,
					selected,
					// A pull-down however many categories the feed happens to carry.
					presentation: 'menu',
					mode: 'OR',
					displayTitle: true,
				},
				apply: {key: 'categories'},
			},
		]
	}, [entries, chosenCategories])

	// News carries exactly one filter (categories); this is that filter, or
	// undefined when the feed's stories have no categories to offer at all.
	let categoryFilter = filters[0]
	let categoryOptions = categoryFilter?.spec.options ?? []
	let selectedCategoryTitles = categoryFilter
		? categoryFilter.spec.selected.map((option) => option.title)
		: []

	let toggleCategory = (title: string) => {
		let current = chosenCategories ?? []
		setChosenCategories(
			current.includes(title) ? current.filter((t) => t !== title) : [...current, title],
		)
	}

	let filteredEntries = filterStories(entries, filters)
	let hasActiveFilter = filters.some((f) => f.spec.selected.length)

	return (
		<>
			{/* @expo/ui needs the scrollable view as the first child to observe
			    its scroll position -- for the large title to collapse, this has
			    to come before the toolbar below it, not after. Calendar.tsx has
			    EventList before CalendarPicker for the same reason. */}
			{isError ? (
				// Still a sibling of the toolbar below, not a full-screen
				// replacement of everything: the source picker is the reader's
				// obvious way out of a feed that's down, and it would be gone
				// exactly when it's needed most if this bailed out before the
				// toolbar ever rendered.
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${error}`}
				/>
			) : (
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
							{isLoading ? (
								<ProgressView />
							) : filteredEntries.length === 0 ? (
								<ContentUnavailableView
									systemImage="newspaper"
									{...emptyStateProps(hasActiveFilter)}
								/>
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
			)}

			{/* expo-router: "If multiple instances of [Stack.Toolbar] are
			    rendered for the same screen, the last one rendered in the
			    component tree takes precedence" -- they don't merge. So the
			    category filter and the source picker share this one toolbar
			    rather than each rendering their own. */}
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.Menu
					accessibilityLabel="Categories"
					hidden={categoryOptions.length === 0}
					icon="line.3.horizontal.decrease"
					variant={hasActiveFilter ? 'prominent' : 'plain'}
				>
					<Stack.Toolbar.Label>Categories</Stack.Toolbar.Label>
					{categoryOptions.map((option) => (
						<Stack.Toolbar.MenuAction
							isOn={selectedCategoryTitles.includes(option.title)}
							key={option.title}
							onPress={() => toggleCategory(option.title)}
							unstable_keepPresented={true}
						>
							{option.title}
						</Stack.Toolbar.MenuAction>
					))}
				</Stack.Toolbar.Menu>

				<Stack.Toolbar.Spacer />

				<Stack.Toolbar.Menu accessibilityLabel="News Sources" icon="newspaper">
					<Stack.Toolbar.Label>News Sources</Stack.Toolbar.Label>
					{props.sources.map((source) => (
						<Stack.Toolbar.MenuAction
							isOn={source.id === props.selectedSourceId}
							key={source.id}
							onPress={() => props.onSelectSource(source.id)}
						>
							{source.title}
						</Stack.Toolbar.MenuAction>
					))}
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>
		</>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
})
