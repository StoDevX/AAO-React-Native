import * as React from 'react'
import {StyleSheet, ScrollView, useWindowDimensions, RefreshControl} from 'react-native'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../../source/lib/partition-by-index'
import {StreamThumbnail} from '../../../source/features/streaming/webcams/thumbnail'
import {webcamsOptions} from '../../../source/features/streaming/webcams/query'
import {useQuery} from '@tanstack/react-query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function WebcamsPage(): React.ReactNode {
	let viewport = useWindowDimensions()
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
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	if (isLoading) {
		return <LoadingView />
	}

	let columns = partitionByIndex(webcams)

	return (
		<ScrollView
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
			refreshControl=<RefreshControl onRefresh={refetch} refreshing={isRefetching} />
			testID="screen-streaming-webcams"
		>
			{columns.map((contents, i) => (
				<Column key={i} style={styles.column}>
					{contents.map((webcam) => (
						<StreamThumbnail key={webcam.name} viewportWidth={viewport.width} webcam={webcam} />
					))}
				</Column>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		padding: 5,
		flexDirection: 'row',
	},
	column: {
		flex: 1,
		alignItems: 'center',
	},
})
