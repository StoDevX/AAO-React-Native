import * as React from 'react'
import {RefreshControl, StyleSheet, ScrollView, View} from 'react-native'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useFaqs} from './query'

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
	},
	scrollView: {
		backgroundColor: c.systemBackground,
	},
	view: {
		paddingVertical: 15,
	},
})

function FaqView(): JSX.Element {
	let {
		data = {text: ''},
		error,
		isLoading,
		isError,
		isRefetching,
		refetch,
	} = useFaqs()

	if (isLoading) {
		return <LoadingView />
	}

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
		<ScrollView
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
			refreshControl={
				<RefreshControl onRefresh={refetch} refreshing={isRefetching} />
			}
			style={styles.scrollView}
		>
			<View style={styles.view}>
				<Markdown source={data.text} />
			</View>
		</ScrollView>
	)
}

export {FaqView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'FAQs',
}
