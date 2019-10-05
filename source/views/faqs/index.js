// @flow
import * as React from 'react'
import delay from 'delay'
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

export function FaqView() {
	let [text, setText] = React.useState('')
	let [loading, setLoading] = React.useState(true)
	let [refreshing, setRefreshing] = React.useState(false)

	React.useEffect(() => {
		fetchData().then(() => setLoading(false))
	})

	let fetchData = async (reload?: boolean) => {
		let {text}: {text: string} = await fetch(API('/faqs'), {
			forReload: reload ? 500 : 0,
		})
			.json()
			.catch(() => ({text: 'There was a problem loading the FAQs'}))

		setText(text)
	}

	let refresh = async (): any => {
		let start = Date.now()
		setRefreshing(true)

		await fetchData(true)

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		setRefreshing(false)
	}

	let refreshControl = (
		<RefreshControl onRefresh={refresh} refreshing={refreshing} />
	)

	let loadingView = <LoadingView />

	let faqList = (
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

	return loading ? loadingView : faqList
}

FaqView.navigationOptions = {
	title: 'FAQs',
}
