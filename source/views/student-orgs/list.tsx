import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'

import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {Column} from '@frogpond/layout'
import {
	Detail,
	emptyList,
	largeListProps,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useDebounce} from '@frogpond/use-debounce'

import {ChangeTextEvent} from '../../navigation/types'
import {useStudentOrgs} from './query'
import type {StudentOrgType} from './types'
import deburr from 'lodash/deburr'
import groupBy from 'lodash/groupBy'
import memoize from 'lodash/memoize'
import toPairs from 'lodash/toPairs'
import words from 'lodash/words'

const splitToArray = memoize((str: string) => words(deburr(str.toLowerCase())))

const orgToArray = memoize((term: StudentOrgType) =>
	Array.from(
		new Set([
			...splitToArray(term.name),
			...splitToArray(term.category),
			...splitToArray(term.description),
		]),
	),
)

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

function StudentOrgsView(): JSX.Element {
	let navigation = useNavigation()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {
		data: orgs = [],
		error,
		isError,
		refetch,
		isRefetching,
		isLoading,
	} = useStudentOrgs()

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.systemFill,
				onChangeText: (event: ChangeTextEvent) =>
					setQuery(event.nativeEvent.text),
			},
		})
	}, [navigation])

	let results = React.useMemo(() => {
		if (!orgs) {
			return emptyList
		}

		if (!searchQuery) {
			return orgs
		}

		return orgs.filter((org) =>
			orgToArray(org).some((word) => word.startsWith(searchQuery)),
		)
	}, [orgs, searchQuery])

	let grouped = React.useMemo(() => {
		return toPairs(groupBy(results, '$groupableName')).map(([k, v]) => {
			return {title: k, data: v}
		})
	}, [results])

	let onPressOrg = React.useCallback(
		(org: StudentOrgType) => navigation.navigate('StudentOrgsDetail', {org}),
		[navigation],
	)

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
					<NoticeView text="No organizations found." />
				)
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item) => item.name + item.category}
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="never"
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<ListRow arrowPosition="top" onPress={() => onPressOrg(item)}>
					<Column flex={1}>
						<Title lines={1}>{item.name}</Title>
						<Detail lines={1}>{item.category}</Detail>
					</Column>
				</ListRow>
			)}
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
}
