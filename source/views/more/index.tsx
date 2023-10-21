import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'

import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {Row} from '@frogpond/layout'
import {
	largeListProps,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {useDebounce} from '@frogpond/use-debounce'

import {ChangeTextEvent} from '../../navigation/types'
import {useSearchLinks} from './query'
import {LinkValue} from './types'
import {deburr, words} from 'lodash'

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
		isRefetching,
	} = useSearchLinks()

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.quaternarySystemFill,
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
			refreshing={isRefetching}
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
