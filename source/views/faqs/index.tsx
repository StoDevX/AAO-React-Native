import * as React from 'react'
import {RefreshControl, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import glamorous from 'glamorous-native'
import {Markdown} from '@frogpond/markdown'
import {LoadingView} from '@frogpond/notice'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
	},
})

let fetchData = async (reload?: boolean) => {
	let {text}: {text: string} = await fetch(API('/faqs'), {
		delay: reload ? 500 : 0,
	})
		.json<{text: string}>()
		.catch(() => ({text: 'There was a problem loading the FAQs'}))

	return text
}

function FaqView(): JSX.Element {
	let [text, setText] = React.useState('')
	let [loading, setLoading] = React.useState(true)
	let [refreshing, setRefreshing] = React.useState(false)

	React.useEffect(() => {
		fetchData().then((text) => {
			setText(text)
			setLoading(false)
		})
	}, [setText, setLoading])

	let refresh = async (): Promise<void> => {
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
		<glamorous.ScrollView
			backgroundColor={c.white}
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
			refreshControl={refreshControl}
		>
			<glamorous.View paddingVertical={15}>
				<Markdown source={text} />
			</glamorous.View>
		</glamorous.ScrollView>
	)
}

export {FaqView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'FAQs',
}
