import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'

import * as c from '@frogpond/colors'
import {ListEmpty, ListSectionHeader, ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'

import {useOtherModesGrouped} from './query'
import {OtherModesRow} from './row'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

let OtherModesView = (): JSX.Element => {
	let {
		data = [],
		error,
		refetch,
		isRefetching,
		isLoading,
		isError,
	} = useOtherModesGrouped()

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
			keyExtractor={(item) => item.name}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<OtherModesRow mode={item} onPress={(mode) => openUrl(mode.url)} />
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={data}
			style={styles.listContainer}
		/>
	)
}

export {OtherModesView as View}
