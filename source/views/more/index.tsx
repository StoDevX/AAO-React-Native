import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'

import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {Row} from '@frogpond/layout'
import {
	ListSeparator,
	ListSectionHeader,
	largeListProps,
	Title,
	ListRow,
	emptyList,
} from '@frogpond/lists'
import {SearchData, LinkGroup, LinkResults, LinkValue} from './types'

import {useFetch} from 'react-async'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {ChangeTextEvent} from '../../navigation/types'
import deburr from 'lodash/deburr'
import words from 'lodash/words'
import groupBy from 'lodash/groupBy'

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	row: {
		marginVertical: 5,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function linkToArray(data: LinkValue) {
	return Array.from(new Set([...splitToArray(data.label)]))
}

let groupResults = (
	searchQuery: string,
	rawData: LinkResults[],
	groupedOriginal: LinkGroup[],
) => {
	if (!rawData) {
		return emptyList
	}

	if (searchQuery.length < 3) {
		return groupedOriginal
	}

	let filtered = rawData.flatMap((data) =>
		data.values.filter((value) =>
			linkToArray(value).some((value) => value.includes(searchQuery)),
		),
	)

	let groupedResults = groupBy(filtered, (result) => result.label[0] || '?')

	let groupedLinks = Object.entries(groupedResults).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	return groupedLinks
}

const useSearchLinks = () => {
	const url = 'https://wp.stolaf.edu/wp-json/site-data/sidebar/a-z'
	return useFetch<SearchData>(url, {
		headers: {accept: 'application/json'},
	})
}

function MoreView(): JSX.Element {
	let navigation = useNavigation()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {
		data: {az_nav: {menu_items: menuItems = []} = {}} = {},
		error,
		isPending,
		isInitial,
		reload,
		isLoading,
	} = useSearchLinks()

	let groupedOriginal = React.useMemo(
		() =>
			menuItems.map(({letter, values}) => ({
				title: letter[0],
				data: values,
			})),
		[menuItems],
	)

	let grouped = React.useMemo(
		() => groupResults(searchQuery, menuItems, groupedOriginal),
		[searchQuery, menuItems, groupedOriginal],
	)

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.white,
				onChangeText: (event: ChangeTextEvent) =>
					setQuery(event.nativeEvent.text),
			},
		})
	}, [navigation])

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text="A problem occured while loading."
			/>
		)
	}

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				searchQuery ? (
					<NoticeView text={`No results found for "${searchQuery}"`} />
				) : isLoading ? (
					<LoadingView />
				) : (
					<NoticeView text="No results found." />
				)
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item: LinkValue, index) => `${item.label}-${index}`}
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="never"
			onRefresh={reload}
			refreshing={isPending && !isInitial}
			renderItem={({item}) => {
				return (
					<ListRow arrowPosition="center" onPress={() => openUrl(item.url)}>
						<Row alignItems="center" style={styles.row}>
							<Title lines={2}>{item.label}</Title>
						</Row>
					</ListRow>
				)
			}}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={grouped}
			style={styles.wrapper}
			{...largeListProps}
		/>
	)
}

export {MoreView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'More',
}
