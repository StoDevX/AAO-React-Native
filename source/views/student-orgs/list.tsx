import * as React from 'react'
import {StyleSheet, RefreshControl, SectionList} from 'react-native'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {Column} from '@frogpond/layout'
import {
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Detail,
	Title,
	largeListProps,
} from '@frogpond/lists'
import {white} from '@frogpond/colors'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import type {StudentOrgType} from './types'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'
import {useAsync} from 'react-async'
import type {AsyncState} from 'react-async'
import {useDebounce} from '@frogpond/use-debounce'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {ChangeTextEvent} from '../../navigation/types'

const fetchOrgs = (args: {
	signal: window.AbortController
}): Promise<Array<StudentOrgType>> => {
	return fetch(API('/orgs'), {signal: args.signal}).json()
}

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function orgToArray(term: StudentOrgType) {
	return Array.from(
		new Set([
			...splitToArray(term.name),
			...splitToArray(term.category),
			...splitToArray(term.description),
		]),
	)
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

function StudentOrgsView(): JSX.Element {
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)
	let [isInitialFetch, setIsInitial] = React.useState(true)

	let navigation = useNavigation()

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: white,
				onChangeText: (event: ChangeTextEvent) =>
					setQuery(event.nativeEvent.text),
			},
		})
	}, [navigation])

	let {data, error, reload, isPending}: AsyncState<Array<StudentOrgType>> =
		useAsync(fetchOrgs, {
			onResolve: () => setIsInitial(false),
		})

	let results = React.useMemo(() => {
		let dataArr = data || []

		if (!searchQuery) {
			return dataArr
		}

		return dataArr.filter((org) =>
			orgToArray(org).some((word) => word.startsWith(searchQuery)),
		)
	}, [data, searchQuery])

	let grouped = React.useMemo(() => {
		return toPairs(groupBy(results, '$groupableName')).map(([k, v]) => {
			return {title: k, data: v}
		})
	}, [results])

	let onPressOrg = React.useCallback(
		(data: StudentOrgType) =>
			navigation.navigate('StudentOrgsDetail', {
				org: data,
			}),
		[navigation],
	)

	// conditionals must come after all hooks
	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text="A problem occured while loading the orgs"
			/>
		)
	}

	if (isInitialFetch) {
		return <LoadingView />
	}

	if (!data || !data.length) {
		return <NoticeView text="No organizations found." />
	}

	let renderRow = ({item}: {item: StudentOrgType}) => (
		<ListRow arrowPosition="top" onPress={() => onPressOrg(item)}>
			<Column flex={1}>
				<Title lines={1}>{item.name}</Title>
				<Detail lines={1}>{item.category}</Detail>
			</Column>
		</ListRow>
	)

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				<NoticeView text={`No results found for "${query}"`} />
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item, index) => item.name + index}
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="never"
			refreshControl={
				<RefreshControl onRefresh={reload} refreshing={isPending} />
			}
			renderItem={renderRow}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={grouped}
			style={styles.wrapper}
			{...largeListProps}
		/>
	)
}

export {StudentOrgsView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Student Orgs',
	headerBackTitle: 'Back',
}
