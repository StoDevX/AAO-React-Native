import * as React from 'react'
import {StyleSheet, ScrollView, useWindowDimensions} from 'react-native'
import {Column} from '@frogpond/layout'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {partitionByIndex} from '../../../lib/partition-by-index'
import {StreamThumbnail} from './thumbnail'
import {webcamsOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {RefreshControl} from 'react-native-gesture-handler'

export let WebcamsView = (): React.ReactNode => {
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
		<GestureHandlerRootView style={{flex: 1}}>
			<ScrollView
				contentContainerStyle={styles.container}
				contentInsetAdjustmentBehavior="automatic"
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
		</GestureHandlerRootView>
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
