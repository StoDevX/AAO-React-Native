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
} from '@frogpond/lists'
import {LinkValue} from './types'

import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {ChangeTextEvent} from '../../navigation/types'
import {deburr, words} from 'lodash'
import {useSearchLinks} from './query'

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

function MoreView(): JSX.Element {
	let navigation = useNavigation()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {
		data = [],
		error,
		refetch,
		isLoading,
		isError,
		isInitialLoading,
	} = useSearchLinks()

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.white,
				onChangeText: (event: ChangeTextEvent) =>
					setQuery(event.nativeEvent.text),
			},
		})
	}, [navigation])

	let filtered = React.useMemo(() => {
		let filteredData = []
		for (let {title, data: items} of data) {
			let filteredItems = items.filter((value) =>
				linkToArray(value).some((value) => value.includes(searchQuery)),
			)
			if (filteredItems.length) {
				filteredData.push({title, data: items})
			}
		}
		return filteredData
	}, [data, searchQuery])

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
			onRefresh={refetch}
			refreshing={isLoading && !isInitialLoading}
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
			sections={filtered}
			style={styles.wrapper}
			{...largeListProps}
		/>
	)
}

export {MoreView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'More',
}
