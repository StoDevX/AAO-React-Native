import * as React from 'react'
import {RefreshControl, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import glamorous from 'glamorous-native'
import {Markdown} from '@frogpond/markdown'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useFaqs} from './query'

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
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
		<glamorous.ScrollView
			backgroundColor={c.white}
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
			refreshControl={
				<RefreshControl onRefresh={refetch} refreshing={isRefetching} />
			}
		>
			<glamorous.View paddingVertical={15}>
				<Markdown source={data.text} />
			</glamorous.View>
		</glamorous.ScrollView>
	)
}

export {FaqView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'FAQs',
}
