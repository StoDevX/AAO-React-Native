import * as React from 'react'
import {StyleSheet, ScrollView, useWindowDimensions} from 'react-native'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../../lib/partition-by-index'
import {StreamThumbnail} from './thumbnail'
import {useWebcams} from './query'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {RefreshControl} from 'react-native-gesture-handler'

export let WebcamsView = (): JSX.Element => {
	let viewport = useWindowDimensions()
	let {
		data: webcams = [],
		error,
		refetch,
		isRefetching,
		isError,
		isLoading,
	} = useWebcams()

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
			refreshControl={
				<RefreshControl onRefresh={refetch} refreshing={isRefetching} />
			}
		>
			{columns.map((contents, i) => (
				<Column key={i} style={styles.column}>
					{contents.map((webcam) => (
						<StreamThumbnail
							key={webcam.name}
							viewportWidth={viewport.width}
							webcam={webcam}
						/>
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
