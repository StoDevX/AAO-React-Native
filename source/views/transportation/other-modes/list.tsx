import * as React from 'react'
import {OtherModesRow} from './row'
import * as c from '../../../modules/colors'
import {SectionList, StyleSheet} from 'react-native'
import {
	ListEmpty,
	ListSectionHeader,
	ListSeparator,
} from '../../../modules/lists'
import {openUrl} from '../../../modules/open-url'
import {useOtherModesGrouped} from './query'
import {LoadingView, NoticeView} from '../../../modules/notice'
import {captureException} from '@sentry/react-native'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

let OtherModesView = (): React.JSX.Element => {
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
				text={`A problem occured while loading: ${String(error)}`}
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
			onRefresh={() => {
				refetch().catch((error: unknown) => captureException(error))
			}}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<OtherModesRow
					mode={item}
					onPress={(mode) => {
						openUrl(mode.url).catch((error: unknown) => captureException(error))
					}}
				/>
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
