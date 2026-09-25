import * as React from 'react'
import {StyleSheet, ScrollView, useWindowDimensions, RefreshControl} from 'react-native'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../../source/lib/partition-by-index'
import {StreamThumbnail} from '../../../source/features/streaming/webcams/thumbnail'
import {webcamsOptions} from '../../../source/features/streaming/webcams/query'
import {useQuery} from '@tanstack/react-query'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'

export default function WebcamsPage(): React.ReactNode {
	let viewport = useWindowDimensions()
	let insets = useSafeAreaInsets()
	let {
		data: webcams = [],
		error,
		refetch,
		isRefetching,
		isError,
		isLoading,
	} = useQuery(webcamsOptions)

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occurred while loading: ${error}`}
			/>
		)
	}

	if (isLoading) {
		return <LoadingView />
	}

	let columns = partitionByIndex(webcams)
	// The tiles share the width left once the notch's side insets are taken.
	let contentWidth = viewport.width - insets.left - insets.right

	return (
		<SafeAreaView edges={['left', 'right']} style={styles.screen}>
			<ScrollView
				contentContainerStyle={styles.container}
				contentInsetAdjustmentBehavior="automatic"
				refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefetching} />}
				testID="screen-streaming-webcams"
			>
				{columns.map((contents, i) => (
					// oxlint-disable-next-line react/no-array-index-key -- a column is its position; the thumbnails inside are keyed by name
					<Column key={i} style={styles.column}>
						{contents.map((webcam) => (
							<StreamThumbnail key={webcam.name} viewportWidth={contentWidth} webcam={webcam} />
						))}
					</Column>
				))}
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	container: {
		padding: 5,
		flexDirection: 'row',
	},
	column: {
		flex: 1,
		alignItems: 'center',
	},
})
