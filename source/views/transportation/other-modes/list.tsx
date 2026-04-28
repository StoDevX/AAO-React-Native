import * as React from 'react'
import {OtherModesRow} from './row'
import * as c from '@frogpond/colors'
import {SectionList, StyleSheet} from 'react-native'
import {ListEmpty, ListSectionHeader, ListSeparator} from '@frogpond/lists'
import {openUrl} from '@frogpond/open-url'
import {otherModesCollection} from './collection'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {groupBy, toPairs} from 'lodash'
import {queryClient} from '../../../init/tanstack-query'

const styles = StyleSheet.create({
	listContainer: {backgroundColor: c.systemBackground},
	contentContainer: {flexGrow: 1},
})

type UtilsSnapshot = {
	isLoading: boolean
	isRefetching: boolean
	isError: boolean
	error: unknown
	refetch: () => void
}

function getUtilsSnapshot(): UtilsSnapshot {
	return {
		isLoading: otherModesCollection.utils.isLoading,
		isRefetching: otherModesCollection.utils.isRefetching,
		isError: otherModesCollection.utils.isError,
		error: otherModesCollection.utils.lastError,
		refetch: () => otherModesCollection.utils.refetch(),
	}
}

let OtherModesView = (): React.ReactNode => {
	// Cache the array to preserve reference stability between renders.
	// useSyncExternalStore requires getSnapshot to return the same reference
	// when the store has not changed.
	let arrayRef = React.useRef(otherModesCollection.toArray)

	// Cache the utils snapshot for the same reason.
	let utilsRef = React.useRef<UtilsSnapshot>(getUtilsSnapshot())

	// Subscribe to data changes, collection status changes, and the query cache
	// so that all loading/error transitions trigger a re-render. The query cache
	// subscription catches background refetch errors that occur after the initial
	// load — collection status stays 'ready' in that case so status:change never
	// fires, but the QueryObserver state (isLoading, isError) still changes.
	let subscribe = React.useCallback((onStoreChange: () => void) => {
		let dataSub = otherModesCollection.subscribeChanges(() => {
			arrayRef.current = otherModesCollection.toArray
			utilsRef.current = getUtilsSnapshot()
			onStoreChange()
		})

		let statusUnsub = otherModesCollection.on('status:change', () => {
			utilsRef.current = getUtilsSnapshot()
			onStoreChange()
		})

		let cacheUnsub = queryClient.getQueryCache().subscribe(() => {
			utilsRef.current = getUtilsSnapshot()
			onStoreChange()
		})

		return () => {
			dataSub.unsubscribe()
			statusUnsub()
			cacheUnsub()
		}
	}, [])

	let modes = React.useSyncExternalStore(subscribe, () => arrayRef.current)

	let utils = React.useSyncExternalStore(subscribe, () => utilsRef.current)

	let {isLoading, isRefetching, isError, error, refetch} = utils

	// Group by category inline (replaces otherModesGroupedOptions select)
	let grouped = toPairs(groupBy(modes, (m) => m.category)).map(
		([key, value]) => ({title: key, data: value}),
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
				isLoading ? <LoadingView /> : <ListEmpty mode="bug" />
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item) => item.name}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<OtherModesRow mode={item} onPress={(mode) => openUrl(mode.url)} />
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={grouped}
			style={styles.listContainer}
		/>
	)
}

export {OtherModesView as View}
