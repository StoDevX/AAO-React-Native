import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {NoticeView, LoadingView} from '../../modules/notice'
import {Column} from '../../modules/layout'
import {
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Detail,
	Title,
	largeListProps,
	emptyList,
} from '../../modules/lists'
import * as c from '../../modules/colors'
import type {StudentOrgType} from './types'
import {useDebounce} from '../../modules/use-debounce'
import {useNavigation} from 'expo-router'
import {memoize, deburr, groupBy, toPairs, words} from 'lodash'
import {useStudentOrgs} from './query'

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

function StudentOrgsView(): React.JSX.Element {
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
				onChangeText: (event: ChangeTextEvent) => {
					setQuery(event.nativeEvent.text)
				},
			},
		})
	}, [navigation])

	let results = React.useMemo(() => {
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
		(org: StudentOrgType) => {
			navigation.navigate('/orgs/[ordId]', {orgId: org.id})
		},
		[navigation],
	)

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${String(error)}`}
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
				<ListRow
					arrowPosition="top"
					onPress={() => {
						onPressOrg(item)
					}}
				>
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
