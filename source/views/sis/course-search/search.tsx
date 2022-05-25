import * as React from 'react'
import {StyleSheet, View, ScrollView} from 'react-native'
import * as c from '@frogpond/colors'
import {
	updateCourseData,
	loadCourseDataIntoMemory,
} from '../../../redux/parts/courses'
import {areAnyTermsCached} from '../../../lib/course-search'
import type {ReduxState} from '../../../redux'
import {useDispatch, useSelector} from 'react-redux'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {AnimatedSearchBar} from '@frogpond/searchbar'
import {RecentItemsList} from '../components/recents-list'
import {Separator} from '@frogpond/separator'
import {buildFilters} from './lib/build-filters'
import type {FilterComboType} from './lib/format-filter-combo'
import fromPairs from 'lodash/fromPairs'
import {useNavigation} from '@react-navigation/native'

const PROMPT_TEXT =
	'We need to download the courses from the server. This will take a few seconds.'
const NETWORK_WARNING =
	'(Please make sure that you are connected to the Internet before downloading the courses).'

type ReduxStateProps = {
	courseDataState: string
	recentFilters: FilterComboType[]
	recentSearches: string[]
}

type ReduxDispatchProps = {
	updateCourseData: () => Promise<any>
	loadCourseDataIntoMemory: () => Promise<any>
}

type Props = ReduxStateProps & ReduxDispatchProps

type Mode = 'loading' | 'pending' | 'ready'

const CourseSearchView = (props: Props): JSX.Element => {
	let [mode, setMode] = React.useState<Mode>('pending')
	let [isSearchbarActive, setIsSearchbarActive] = React.useState(false)
	let [typedQuery, setTypedQuery] = React.useState('')

	let navigation = useNavigation()

	let loadData = React.useCallback(
		async ({userInitiated = true}: {userInitiated?: boolean} = {}) => {
			let hasCache = await areAnyTermsCached()

			if (!hasCache && !userInitiated) {
				// if no terms are cached, and the user didn't push the button,
				// then don't download anything.
				setMode('pending')
				return
			}

			setMode('loading')

			// If the data has not been loaded into Redux State:
			if (props.courseDataState !== 'ready') {
				// 1. load the cached courses
				await props.loadCourseDataIntoMemory()

				// 2. if any courses are cached, hide the spinner
				if (hasCache) {
					setMode('ready')
				}

				// 3. either way, start updating courses in the background
				await props.updateCourseData()
			} else {
				// If the course data is already in Redux State, check for update
				await props.updateCourseData()
			}

			// 4. when everything is done, make sure the spinner is hidden
			setMode('ready')
		},
		[props],
	)

	React.useEffect(() => {
		loadData({userInitiated: false})
	}, [loadData])

	let handleSearchSubmit = () => {
		navigation.navigate('CourseSearchResults', {
			initialQuery: typedQuery,
		})
		setIsSearchbarActive(false)
		setTypedQuery('')
	}

	let handleSearchCancel = () => {
		setIsSearchbarActive(false)
		setTypedQuery('')
	}

	let handleSearchChange = (value: string) => {
		setTypedQuery(value)
	}

	let handleSearchFocus = () => {
		setIsSearchbarActive(true)
	}

	let browseAll = () => {
		navigation.navigate('CourseSearchResults', {initialQuery: ''})
	}

	let onRecentSearchPress = (text: string) => {
		navigation.navigate('CourseSearchResults', {initialQuery: text})
	}

	let onRecentFilterPress = async (text: string) => {
		let {recentFilters} = props
		let selectedFilterCombo = recentFilters.find((f) => f.description === text)

		let freshFilters = await buildFilters()
		let selectedFilters = freshFilters
		if (selectedFilterCombo) {
			let filterLookup = fromPairs(
				selectedFilterCombo.filters.map((f) => [f.key, f]),
			)
			selectedFilters = freshFilters.map((f) => filterLookup[f.key] || f)
		}

		navigation.navigate('CourseSearchResults', {
			initialFilters: selectedFilters,
		})
	}

	if (mode === 'loading') {
		return <LoadingView text="Loading Course Data…" />
	}

	if (props.courseDataState === 'not-loaded') {
		let msg = PROMPT_TEXT + '\n\n' + NETWORK_WARNING

		return (
			<NoticeView
				buttonText="Download"
				header="Almost there…"
				onPress={loadData}
				text={msg}
			/>
		)
	}

	let recentFilterDescriptions = props.recentFilters.map((f) => f.description)

	return (
		<View style={[styles.container, styles.common]}>
			<AnimatedSearchBar
				active={isSearchbarActive}
				onCancel={handleSearchCancel}
				onChange={handleSearchChange}
				onFocus={handleSearchFocus}
				onSubmit={handleSearchSubmit}
				placeholder="Search Class & Lab"
				title="Search Courses"
				value={typedQuery}
			/>

			<Separator />

			<ScrollView
				keyboardDismissMode="interactive"
				style={[styles.common, styles.bottomContainer]}
			>
				<RecentItemsList
					emptyHeader="No recent searches"
					emptyText="Your recent searches will appear here."
					items={props.recentSearches}
					onItemPress={onRecentSearchPress}
					title="Recent"
				/>
				<RecentItemsList
					actionLabel="Browse All"
					emptyHeader="No recent filter combinations"
					emptyText="Your recent filter combinations will appear here."
					items={recentFilterDescriptions}
					onAction={browseAll}
					onItemPress={onRecentFilterPress}
					title="Browse"
				/>
			</ScrollView>
		</View>
	)
}

export function ConnectedCourseSearchView(): JSX.Element {
	let dispatch = useDispatch()

	let courseDataState = useSelector(
		(state: ReduxState) => state.courses?.readyState || '',
	)
	let recentFilters = useSelector(
		(state: ReduxState) => state.courses?.recentFilters || [],
	)
	let recentSearches = useSelector(
		(state: ReduxState) => state.courses?.recentSearches || [],
	)

	let _loadCourseDataIntoMemory = React.useCallback(
		() => dispatch(loadCourseDataIntoMemory()),
		[dispatch],
	)
	let _updateCourseData = React.useCallback(
		() => dispatch(updateCourseData()),
		[dispatch],
	)

	return (
		<CourseSearchView
			courseDataState={courseDataState}
			loadCourseDataIntoMemory={_loadCourseDataIntoMemory}
			recentFilters={recentFilters}
			recentSearches={recentSearches}
			updateCourseData={_updateCourseData}
		/>
	)
}

let styles = StyleSheet.create({
	bottomContainer: {
		paddingTop: 12,
	},
	container: {
		flex: 1,
	},
	common: {
		backgroundColor: c.white,
	},
})
