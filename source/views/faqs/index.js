// @flow
import * as React from 'react'
import {RefreshControl, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {View, ScrollView} from 'glamorous-native'
import {Markdown} from '@frogpond/markdown'
import {LoadingView} from '@frogpond/notice'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
	},
})

let fetchData = async (reload?: boolean) => {
	let {text}: {text: string} = await fetch(API('/faqs'), {
		delay: reload ? 500 : 0,
	})
		.json()
		.catch(() => ({text: 'There was a problem loading the FAQs'}))

	return text
}

export function FaqView() {
	let [text, setText] = React.useState('')
	let [loading, setLoading] = React.useState(true)
	let [refreshing, setRefreshing] = React.useState(false)

	React.useEffect(() => {
		fetchData().then((text) => {
			setText(text)
			setLoading(false)
		})
	}, [setText, setLoading])

	let refresh = async (): any => {
		setRefreshing(true)

		await fetchData(true).then((text) => {
			setText(text)
		})

		setRefreshing(false)
	}

	let refreshControl = (
		<RefreshControl onRefresh={refresh} refreshing={refreshing} />
	)

	if (loading) {
		return <LoadingView />
	}

	return (
		<ScrollView
			backgroundColor={c.white}
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
			refreshControl={refreshControl}
		>
			<View paddingVertical={15}>
				<Markdown source={text} />
			</View>
		</ScrollView>
	)
}

FaqView.navigationOptions = {
	title: 'FAQs',
}
