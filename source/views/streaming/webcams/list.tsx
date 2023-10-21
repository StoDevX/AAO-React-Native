import * as React from 'react'
import {ScrollView, StyleSheet, useWindowDimensions} from 'react-native'

import {RefreshControl} from 'react-native-gesture-handler'

import {Column} from '@frogpond/layout'
import {LoadingView, NoticeView} from '@frogpond/notice'

import {partitionByIndex} from '../../../lib/partition-by-index'
import {useWebcams} from './query'
import {StreamThumbnail} from './thumbnail'

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
			testID="screen-streaming-webcams"
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
