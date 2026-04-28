import * as React from 'react'
import {OtherModesRow} from './row'
import * as c from '@frogpond/colors'
import {SectionList, StyleSheet} from 'react-native'
import {ListEmpty, ListSectionHeader, ListSeparator} from '@frogpond/lists'
import {openUrl} from '@frogpond/open-url'
import {otherModesCollection} from './collection'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {groupBy, toPairs} from 'lodash'

const styles = StyleSheet.create({
	listContainer: {backgroundColor: c.systemBackground},
	contentContainer: {flexGrow: 1},
})

type UtilsSnapshot = {
	isLoading: boolean
	isError: boolean
	error: unknown
	refetch: () => void
}

function getUtilsSnapshot(): UtilsSnapshot {
	return {
		isLoading: otherModesCollection.utils.isLoading,
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

	// Subscribe to both data changes and collection status changes so that
	// loading → ready and loading → error transitions both trigger a re-render.
	let subscribe = React.useCallback((onStoreChange: () => void) => {
		let dataSub = otherModesCollection.subscribeChanges(() => {
			arrayRef.current = otherModesCollection.toArray
			onStoreChange()
		})

		let statusUnsub = otherModesCollection.on('status:change', () => {
			utilsRef.current = getUtilsSnapshot()
			onStoreChange()
		})

		return () => {
			dataSub.unsubscribe()
			statusUnsub()
		}
	}, [])

	let modes = React.useSyncExternalStore(subscribe, () => arrayRef.current)

	let utils = React.useSyncExternalStore(subscribe, () => utilsRef.current)

	let {isLoading, isError, error, refetch} = utils

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
			ListEmptyComponent={isLoading ? <LoadingView /> : <ListEmpty mode="bug" />}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item) => item.name}
			onRefresh={refetch}
			refreshing={isLoading}
			sections={grouped}
			style={styles.listContainer}
			renderItem={({item}) => (
				<OtherModesRow mode={item} onPress={(mode) => openUrl(mode.url)} />
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
		/>
	)
}

export {OtherModesView as View}
