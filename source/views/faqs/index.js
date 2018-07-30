// @flow
import * as React from 'react'
import {RefreshControl, StyleSheet} from 'react-native'
import * as c from '../components/colors'
import {View, ScrollView} from 'glamorous-native'
import {Markdown} from '../components/markdown'
import {NoticeView} from '../components/notice'
import {aaoGh} from '@app/fetch'
import {DataFetcher} from '@frogpond/data-fetcher'
import {age} from '@frogpond/age'

let faqs = aaoGh({
	file: 'faqs.json',
	version: 2,
	cacheControl: {
		maxAge: age.days(1),
		staleWhileRevalidate: true,
		staleIfOffline: true,
	},
})

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
		paddingHorizontal: 15,
	},
})

type Props = {}

type DataFetcherProps = {
	faqs: {
		data: string,
		error: ?Error,
		loading: boolean,
		refresh: () => any,
	},
}

export class FaqView extends React.Component<Props> {
	static navigationOptions = {
		title: 'FAQs',
	}

	render() {
		return (
			<DataFetcher
				error={NoticeView}
				render={({faqs}: DataFetcherProps) => {
					let {data: text, loading, refresh} = faqs

					let refreshControl = (
						<RefreshControl onRefresh={refresh} refreshing={loading} />
					)

					return (
						<ScrollView
							contentContainerStyle={styles.container}
							contentInsetAdjustmentBehavior="automatic"
							refreshControl={refreshControl}
						>
							<View paddingVertical={15}>
								<Markdown source={text} />
							</View>
						</ScrollView>
					)
				}}
				resources={{faqs}}
			/>
		)
	}
}
